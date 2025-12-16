<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'resource',
        'action',
    ];

    // Relaciones
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permission');
    }

    // Scopes
    public function scopePorRecurso($query, $resource)
    {
        return $query->where('resource', $resource);
    }

    public function scopePorAccion($query, $action)
    {
        return $query->where('action', $action);
    }
}
