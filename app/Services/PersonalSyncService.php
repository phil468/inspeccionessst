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
use Illuminate\Support\Facades\Cache;
use Exception;

class PersonalSyncService
{
    private const API_URL = 'https://apps.vanguardfresh.pe/sv/ivg/api/manager/capacitaciones/personalV2/0';
    
    private $authService;

    // Cachés en memoria para evitar queries repetitivas
    private array $empresaCache = [];
    private array $areaCache = [];
    private array $cargoCache = [];
    private array $planillaCache = [];
    private array $tipoTrabajadorCache = [];
    private array $tipoPersonalCache = [];
    private array $personalDniCache = [];

    public function __construct(ExternalApiAuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Obtener estado actual de la sincronización
     */
    public static function getSyncStatus(): array
    {
        $status = Cache::get('personal_sync_status', [
            'running' => false,
            'progress' => 0,
            'total' => 0,
            'processed' => 0,
            'stats' => null,
            'message' => '',
            'finished' => false,
            'error' => null,
        ]);

        // Si lleva más de 10 minutos "running" sin progreso, considerarlo muerto
        if (!empty($status['running']) && !empty($status['started_at'])) {
            $startedAt = \Carbon\Carbon::parse($status['started_at']);
            $minutesRunning = $startedAt->diffInMinutes(now());

            if ($minutesRunning > 10 && empty($status['processed'])) {
                $status['running'] = false;
                $status['finished'] = true;
                $status['error'] = 'La sincronización no respondió. Intente nuevamente.';
                Cache::put('personal_sync_status', $status, 60);
            }
        }

        return $status;
    }

    /**
     * Actualizar estado de sincronización en caché
     */
    private function updateSyncStatus(array $data): void
    {
        $current = Cache::get('personal_sync_status', []);
        Cache::put('personal_sync_status', array_merge($current, $data), 600); // 10 min TTL
    }

    /**
     * Pre-cargar catálogos en memoria para evitar queries repetitivas
     */
    private function preloadCatalogs(): void
    {
        // Pre-cargar empresas
        foreach (Empresa::all() as $e) {
            $key = strtolower(trim($e->name));
            $this->empresaCache[$key] = $e;
        }

        // Pre-cargar áreas
        foreach (Area::all() as $a) {
            $key = ($a->idarea_nisira ?? '') . '_' . ($a->empresa_id ?? '');
            $this->areaCache[$key] = $a;
        }

        // Pre-cargar cargos
        foreach (Cargo::all() as $c) {
            $key = ($c->idcargo_nisira ?? '') . '_' . ($c->empresa_id ?? '');
            $this->cargoCache[$key] = $c;
        }

        // Pre-cargar planillas
        foreach (Planilla::all() as $p) {
            $key = ($p->idplanilla_nisira ?? '') . '_' . ($p->empresa_id ?? '');
            $this->planillaCache[$key] = $p;
        }

        // Pre-cargar tipos de trabajador
        foreach (TipoDeTrabajador::all() as $t) {
            $key = ($t->idtipotrabajador_nisira ?? '') . '_' . ($t->empresa_id ?? '');
            $this->tipoTrabajadorCache[$key] = $t;
        }

        // Pre-cargar tipos de personal
        foreach (TipoDePersonal::all() as $t) {
            $key = ($t->idtipopersonal_nisira ?? '') . '_' . ($t->empresa_id ?? '');
            $this->tipoPersonalCache[$key] = $t;
        }

        // Pre-cargar personal por DNI
        foreach (Personal::select('id', 'dni', 'seleccionado', 'cesado')->get() as $p) {
            $this->personalDniCache[$p->dni] = $p;
        }

        Log::info('Catálogos pre-cargados en memoria', [
            'empresas' => count($this->empresaCache),
            'areas' => count($this->areaCache),
            'cargos' => count($this->cargoCache),
            'personal' => count($this->personalDniCache),
        ]);
    }

    /**
     * Sincroniza el personal desde el API externo
     */
    public function syncFromExternalApi()
    {
        try {
            $this->updateSyncStatus([
                'running' => true,
                'progress' => 0,
                'total' => 0,
                'processed' => 0,
                'stats' => null,
                'message' => 'Obteniendo token de autenticación...',
                'finished' => false,
                'error' => null,
                'started_at' => now()->toISOString(),
            ]);

            // Obtener token válido
            $token = $this->authService->getValidToken();

            if (!$token) {
                $this->updateSyncStatus([
                    'running' => false,
                    'finished' => true,
                    'error' => 'No se pudo obtener token de autenticación del API externo',
                ]);
                return [
                    'success' => false,
                    'message' => 'No se pudo obtener token de autenticación del API externo',
                ];
            }

            $this->updateSyncStatus(['message' => 'Descargando datos del API externo...']);

            // Obtener datos del API con autenticación
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token->access_token,
                ])
                ->timeout(120)
                ->get(self::API_URL);
            
            if (!$response->successful()) {
                throw new Exception('Error al consultar el API: ' . $response->status());
            }

            $personalData = $response->json();
            
            if (empty($personalData)) {
                $this->updateSyncStatus([
                    'running' => false,
                    'finished' => true,
                    'error' => 'No se obtuvo información del API',
                ]);
                return [
                    'success' => false,
                    'message' => 'No se obtuvo información del API',
                ];
            }

            $totalRecords = count($personalData);
            $this->updateSyncStatus([
                'message' => "Pre-cargando catálogos...",
                'total' => $totalRecords,
            ]);

            // Pre-cargar catálogos en memoria
            $this->preloadCatalogs();

            $stats = [
                'nuevos' => 0,
                'actualizados' => 0,
                'cesados' => 0,
                'errors' => 0,
            ];

            // Marcar todos los registros importados actuales para comparar después
            $dniFromApi = collect($personalData)->pluck('NRODOCUMENTO')->filter()->unique()->toArray();

            $this->updateSyncStatus([
                'message' => "Procesando $totalRecords registros...",
            ]);

            // Procesar en lotes de 200 con transacciones por lote
            $chunks = array_chunk($personalData, 200);
            $processed = 0;

            foreach ($chunks as $chunkIndex => $chunk) {
                DB::beginTransaction();
                try {
                    foreach ($chunk as $item) {
                        try {
                            $this->processPersonalRecord($item, $stats);
                        } catch (Exception $e) {
                            $stats['errors']++;
                            Log::error('Error procesando personal: ' . $e->getMessage(), [
                                'dni' => $item['NRODOCUMENTO'] ?? 'N/A',
                            ]);
                        }
                        $processed++;
                    }
                    DB::commit();
                } catch (Exception $e) {
                    DB::rollBack();
                    $stats['errors'] += count($chunk);
                    Log::error('Error en lote ' . ($chunkIndex + 1) . ': ' . $e->getMessage());
                }

                // Actualizar progreso cada lote
                $progress = round(($processed / $totalRecords) * 100);
                $this->updateSyncStatus([
                    'processed' => $processed,
                    'progress' => $progress,
                    'message' => "Procesando... $processed de $totalRecords ($progress%)",
                    'stats' => $stats,
                ]);
            }

            // Marcar como cesados los que NO aparecen en el API pero están importados
            $cesados = Personal::where('importado', 1)
                ->whereNotIn('dni', $dniFromApi)
                ->where('cesado', 0)
                ->update([
                    'cesado' => 1,
                    'fecha_cese' => now(),
                    'seleccionado' => 0,
                ]);

            $stats['cesados'] = $cesados;

            $this->updateSyncStatus([
                'running' => false,
                'finished' => true,
                'progress' => 100,
                'processed' => $totalRecords,
                'stats' => $stats,
                'message' => 'Sincronización completada',
                'error' => null,
                'finished_at' => now()->toISOString(),
            ]);

            return [
                'success' => true,
                'message' => 'Sincronización completada',
                'stats' => $stats,
            ];

        } catch (Exception $e) {
            Log::error('Error en sincronización de personal: ' . $e->getMessage());

            $this->updateSyncStatus([
                'running' => false,
                'finished' => true,
                'error' => 'Error en sincronización: ' . $e->getMessage(),
                'message' => 'Error en sincronización',
            ]);
            
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

        // Buscar o crear empresa (con caché en memoria)
        $empresa = $this->findOrCreateEmpresaCached($item['empresa'] ?? null, $item['IDEMPRESA'] ?? null);
        
        // Buscar o crear área (con caché en memoria)
        $area = $this->findOrCreateAreaCached(
            $item['IDCCOSTO'] ?? null,
            $item['CENTRO_COSTO'] ?? null,
            $empresa
        );
        
        // Buscar o crear cargo (con caché en memoria)
        $cargo = $this->findOrCreateCargoCached(
            $item['IDCARGO'] ?? null,
            $item['cargo'] ?? null,
            $empresa
        );
        
        // Buscar o crear planilla (con caché en memoria)
        $planilla = $this->findOrCreatePlanillaCached(
            $item['IDPLANILLA'] ?? null,
            $item['planilla'] ?? null,
            $empresa
        );
        
        // Buscar o crear tipo de trabajador (con caché en memoria)
        $tipoTrabajador = $this->findOrCreateTipoTrabajadorCached(
            $item['IDTIPOTRABAJADOR'] ?? null,
            $item['TIPOTRABAJADOR'] ?? null,
            $empresa
        );
        
        // Buscar o crear tipo de personal (con caché en memoria)
        $tipoPersonal = $this->findOrCreateTipoPersonalCached(
            $item['IDTIPOPERSONAL'] ?? null,
            $item['tipopersonal'] ?? null,
            $empresa
        );

        // Buscar si ya existe el personal (desde caché en memoria)
        $personal = $this->personalDniCache[$dni] ?? null;
        $isNew = !$personal;

        if ($isNew) {
            $personal = new Personal();
            $personal->dni = $dni;
        } else {
            // Recargar modelo completo solo cuando necesitamos actualizar
            $personal = Personal::find($personal->id);
            if (!$personal) {
                $personal = new Personal();
                $personal->dni = $dni;
                $isNew = true;
            }
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
                
                // Actualizar caché en memoria
                $this->personalDniCache[$dni] = $personal;
                
                if ($isNew) {
                    $stats['nuevos']++;
                } else {
                    $stats['actualizados']++;
                }
            }
        }
    }

    /**
     * Busca o crea una empresa (con caché en memoria)
     */
    private function findOrCreateEmpresaCached(?string $nombre, ?string $idEmpresa)
    {
        if (!$nombre && !$idEmpresa) {
            return null;
        }

        if (!$idEmpresa || trim($idEmpresa) === '') {
            return null;
        }

        $key = strtolower(trim($nombre));

        if (isset($this->empresaCache[$key])) {
            return $this->empresaCache[$key];
        }

        $empresa = Empresa::firstOrCreate(
            ['name' => trim($nombre)],
            ['activo' => true]
        );

        $this->empresaCache[$key] = $empresa;
        return $empresa;
    }

    /**
     * Busca o crea un área (con caché en memoria)
     */
    private function findOrCreateAreaCached(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        $key = ($id ?? '') . '_' . ($empresa?->id ?? '');

        if (isset($this->areaCache[$key])) {
            return $this->areaCache[$key];
        }

        $nombreArea = $nombre ? trim($nombre) : 'No especificado';

        $area = Area::firstOrCreate(
            [
                'idarea_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombreArea,
                'centro_costo' => $id,
                'activo' => true,
            ]
        );

        $this->areaCache[$key] = $area;
        return $area;
    }

    /**
     * Busca o crea un cargo (con caché en memoria)
     */
    private function findOrCreateCargoCached(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        $key = ($id ?? '') . '_' . ($empresa?->id ?? '');

        if (isset($this->cargoCache[$key])) {
            return $this->cargoCache[$key];
        }

        $cargo = Cargo::firstOrCreate(
            [
                'idcargo_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'activo' => true,
            ]
        );

        $this->cargoCache[$key] = $cargo;
        return $cargo;
    }

    /**
     * Busca o crea un tipo de trabajador (con caché en memoria)
     */
    private function findOrCreateTipoTrabajadorCached(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        $key = ($id ?? '') . '_' . ($empresa?->id ?? '');

        if (isset($this->tipoTrabajadorCache[$key])) {
            return $this->tipoTrabajadorCache[$key];
        }

        $tipo = TipoDeTrabajador::firstOrCreate(
            [
                'idtipotrabajador_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );

        $this->tipoTrabajadorCache[$key] = $tipo;
        return $tipo;
    }

    /**
     * Busca o crea un tipo de personal (con caché en memoria)
     */
    private function findOrCreateTipoPersonalCached(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        $key = ($id ?? '') . '_' . ($empresa?->id ?? '');

        if (isset($this->tipoPersonalCache[$key])) {
            return $this->tipoPersonalCache[$key];
        }

        $tipo = TipoDePersonal::firstOrCreate(
            [
                'idtipopersonal_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );

        $this->tipoPersonalCache[$key] = $tipo;
        return $tipo;
    }

    /**
     * Busca o crea una planilla (con caché en memoria)
     */
    private function findOrCreatePlanillaCached(?string $id, ?string $nombre, ?Empresa $empresa)
    {
        if (!$id && !$nombre) {
            return null;
        }

        $key = ($id ?? '') . '_' . ($empresa?->id ?? '');

        if (isset($this->planillaCache[$key])) {
            return $this->planillaCache[$key];
        }

        $planilla = Planilla::firstOrCreate(
            [
                'idplanilla_nisira' => $id,
                'empresa_id' => $empresa?->id,
            ],
            [
                'name' => $nombre ?? 'No especificado',
                'estado' => 1,
            ]
        );

        $this->planillaCache[$key] = $planilla;
        return $planilla;
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
