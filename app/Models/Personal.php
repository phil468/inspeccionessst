<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Personal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'personal';

    protected $fillable = [
        'dni',
        'name',
        'nombres',
        'apellido_paterno',
        'apellido_materno',
        'empresa_id',
        'area_id',
        'cargo_id',
        'tipo_de_trabajador_id',
        'tipo_de_personal_id',
        'planilla_id',
        'reporta_a',
        'correo_empresa',
        'celular_empresa',
        'genero',
        'sexo',
        'fecha_ingreso',
        'fecha_cese',
        'estado',
        'seleccionado',
        'cesado',
        'importado',
        'inspector',
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_cese' => 'date',
        'estado' => 'boolean',
        'seleccionado' => 'boolean',
        'cesado' => 'boolean',
        'importado' => 'boolean',
        'inspector' => 'boolean',
    ];

    /**
     * Bootstrap del modelo
     */
    protected static function boot()
    {
        parent::boot();

        // Generar nombre completo antes de crear
        static::creating(function ($personal) {
            if (empty($personal->name) && ($personal->apellido_paterno || $personal->nombres)) {
                $personal->name = trim(
                    ($personal->apellido_paterno ?? '') . ' ' .
                    ($personal->apellido_materno ?? '') . ' ' .
                    ($personal->nombres ?? '')
                );
            }
        });

        // Generar nombre completo antes de actualizar
        static::updating(function ($personal) {
            if ($personal->isDirty(['apellido_paterno', 'apellido_materno', 'nombres'])) {
                $personal->name = trim(
                    ($personal->apellido_paterno ?? '') . ' ' .
                    ($personal->apellido_materno ?? '') . ' ' .
                    ($personal->nombres ?? '')
                );
            }
        });
    }

    // Relaciones
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function cargo()
    {
        return $this->belongsTo(Cargo::class);
    }

    public function tipoDeTrabajador()
    {
        return $this->belongsTo(TipoDeTrabajador::class);
    }

    public function tipoDePersonal()
    {
        return $this->belongsTo(TipoDePersonal::class);
    }

    public function planilla()
    {
        return $this->belongsTo(Planilla::class);
    }

    public function reportaA()
    {
        return $this->belongsTo(Personal::class, 'reporta_a');
    }

    public function subordinados()
    {
        return $this->hasMany(Personal::class, 'reporta_a');
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('estado', 1)->where('cesado', 0);
    }

    public function scopeCesado($query)
    {
        return $query->where('cesado', 1);
    }

    public function scopeImportado($query)
    {
        return $query->where('importado', 1);
    }

    public function scopeConRelaciones($query)
    {
        return $query->with([
            'empresa',
            'area',
            'cargo',
            'tipoDeTrabajador',
            'tipoDePersonal',
            'planilla',
            'reportaA',
        ]);
    }
}
