<?php

namespace App\Services;

use App\Models\Personal;
use App\Models\Empresa;
use App\Models\Area;
use App\Models\Cargo;
use App\Models\TipoDeTrabajador;
use App\Models\TipoDePersonal;
use App\Models\Planilla;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class PersonalSyncService
{
    private const API_URL = 'https://apps.vanguardfresh.pe/sv/ivg/api/manager/capacitaciones/personal/0';
    
    private $authService;

    public function __construct(ExternalApiAuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Sincroniza el personal desde el API externo
     */
    public function syncFromExternalApi()
    {
        try {
            // Obtener token válido
            $token = $this->authService->getValidToken();

            if (!$token) {
                return [
                    'success' => false,
                    'message' => 'No se pudo obtener token de autenticación del API externo',
                ];
            }

            // Obtener datos del API con autenticación
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token->access_token,
                ])
                ->timeout(60)
                ->get(self::API_URL);
            
            if (!$response->successful()) {
                throw new Exception('Error al consultar el API: ' . $response->status());
            }

            $personalData = $response->json();
            
            if (empty($personalData)) {
                return [
                    'success' => false,
                    'message' => 'No se obtuvo información del API',
                ];
            }

            $stats = [
                'nuevos' => 0,
                'actualizados' => 0,
                'cesados' => 0,
                'errors' => 0,
            ];

            // Marcar todos los registros importados actuales para comparar después
            $dniFromApi = collect($personalData)->pluck('NRODOCUMENTO')->filter()->unique()->toArray();
            
            DB::beginTransaction();

            try {
                // Procesar en lotes de 100
                $chunks = array_chunk($personalData, 100);

                foreach ($chunks as $chunk) {
                    foreach ($chunk as $item) {
                        try {
                            $this->processPersonalRecord($item, $stats);
                        } catch (Exception $e) {
                            $stats['errors']++;
                            Log::error('Error procesando personal: ' . $e->getMessage(), [
                                'data' => $item,
                            ]);
                        }
                    }
                }

                // Marcar como cesados los que NO aparecen en el API pero están importados
                $cesados = Personal::where('importado', 1)
                    ->whereNotIn('dni', $dniFromApi)
                    ->where('cesado', 0)
                    ->update([
                        'cesado' => 1,
                        'fecha_cese' => now(),
                        'seleccionado' => 0, // Desmarcar si estaba seleccionado
                    ]);

                $stats['cesados'] = $cesados;

                DB::commit();

                return [
                    'success' => true,
                    'message' => 'Sincronización completada',
                    'stats' => $stats,
                ];

            } catch (Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            Log::error('Error en sincronización de personal: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Error en sincronización: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Procesa un registro individual de personal del API
     */
    private function processPersonalRecord(array $item, array &$stats)
    {
        $dni = $item['NRODOCUMENTO'] ?? null;
        
        if (!$dni) {
            return; // Skip si no tiene DNI
        }

        // Buscar o crear empresa
        $empresa = $this->findOrCreateEmpresa($item['empresa'] ?? null, $item['IDEMPRESA'] ?? null);
        
        // Buscar o crear área
        $area = $this->findOrCreateArea(
            $item['IDCCOSTO'] ?? null,
            $item['CENTRO_COSTO'] ?? null,
            $empresa
        );
        
        // Buscar o crear cargo
        $cargo = $this->findOrCreateCargo(
            $item['IDCARGO'] ?? null,
            $item['cargo'] ?? null,
            $empresa
        );
        
        // Buscar o crear planilla
        $planilla = $this->findOrCreatePlanilla(
            $item['IDPLANILLA'] ?? null,
            $item['planilla'] ?? null,
            $empresa
        );
        
        // Buscar o crear tipo de trabajador
        $tipoTrabajador = $this->findOrCreateTipoTrabajador(
            $item['IDTIPOTRABAJADOR'] ?? null,
            $item['TIPOTRABAJADOR'] ?? null,
            $empresa
        );
        
        // Buscar o crear tipo de personal
        $tipoPersonal = $this->findOrCreateTipoPersonal(
            $item['IDTIPOPERSONAL'] ?? null,
            $item['tipopersonal'] ?? null,
            $empresa
        );

        // Buscar si ya existe el personal
        $personal = Personal::where('dni', $dni)->first();
        $isNew = !$personal;

        if (!$personal) {
            $personal = new Personal();
            $personal->dni = $dni;
        }

        // Solo actualizar si NO está seleccionado
        if (!$personal->seleccionado) {
            $personal->name = mb_strtoupper(trim($item['nombrecompleto'] ?? $item['NOMBRES'] ?? ''));
            $personal->nombres = mb_strtoupper(trim($item['NOMBRES'] ?? ''));
            $personal->apellido_paterno = mb_strtoupper(trim($item['A_PATERNO'] ?? ''));
            $personal->apellido_materno = mb_strtoupper(trim($item['A_MATERNO'] ?? ''));
            $personal->empresa_id = $empresa?->id;
            $personal->area_id = $area?->id;
            $personal->cargo_id = $cargo?->id;
            $personal->planilla_id = $planilla?->id;
            $personal->tipo_de_trabajador_id = $tipoTrabajador?->id;
            $personal->tipo_de_personal_id = $tipoPersonal?->id;
            $personal->sexo = $item['sexo'] ?? null;
            $personal->estado = 1;
            $personal->cesado = 0;
            $personal->importado = 1;
            $personal->fecha_cese = null;
            $personal->fecha_ingreso = $this->parseDate($item['FECHA_INGRESO'] ?? null);

            // Si tiene usuario, actualizar correo_empresa con el email del usuario
            if ($personal->user) {
                $personal->correo_empresa = $personal->user->email;
            }

            // Solo guardar si hubo cambios
            if ($personal->isDirty()) {
                $personal->save();
                
                if ($isNew) {
                    $stats['nuevos']++;
                } else {
                    $stats['actualizados']++;
                }
            }
        }
    }

    /**
     * Busca o crea una empresa
     */
    private function findOrCreateEmpresa(?string $nombre, ?string $idEmpresa)
    {
        if (!$nombre && !$idEmpresa) {
            return null;
        }

        // Validar que tenga ID de empresa
        if (!$idEmpresa || trim($idEmpresa) === '') {
            return null;
        }

        return Empresa::firstOrCreate(
            ['name' => trim($nombre)],
            [
                'activo' => true,
            ]
        );
    }

    /**
     * Busca o crea un área
     */
    private function findOrCreateArea(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        // Usar CENTRO_COSTO como nombre si está disponible
        $nombreArea = $nombre ? trim($nombre) : 'No especificado';

        return Area::firstOrCreate(
            [
                'idarea_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombreArea,
                'centro_costo' => $id, // Guardar el ID como centro de costo
                'activo' => true,
            ]
        );
    }

    /**
     * Busca o crea un cargo
     */
    private function findOrCreateCargo(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        return Cargo::firstOrCreate(
            [
                'idcargo_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'activo' => true,
            ]
        );
    }

    /**
     * Busca o crea un tipo de trabajador
     */
    private function findOrCreateTipoTrabajador(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        return TipoDeTrabajador::firstOrCreate(
            [
                'idtipotrabajador_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );
    }

    /**
     * Busca o crea un tipo de personal
     */
    private function findOrCreateTipoPersonal(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        return TipoDePersonal::firstOrCreate(
            [
                'idtipopersonal_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );
    }

    /**
     * Busca o crea una planilla
     */
    private function findOrCreatePlanilla(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        return Planilla::firstOrCreate(
            [
                'idplanilla_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );
    }

    /**
     * Parse una fecha del API
     */
    private function parseDate(?string $date)
    {
        if (!$date) {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($date)->format('Y-m-d');
        } catch (Exception $e) {
            return null;
        }
    }
}
