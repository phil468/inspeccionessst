import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Usuario, Rol, Permission, RolFormData } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  constructor(private apiService: ApiService) {}

  // Usuarios
  getUsuarios(): Promise<Usuario[]> {
    return this.apiService.get<Usuario[]>('/usuarios');
  }

  getUsuario(id: number): Promise<Usuario> {
    return this.apiService.get<Usuario>(`/usuarios/${id}`);
  }

  createUsuario(usuario: Partial<Usuario>): Promise<Usuario> {
    return this.apiService.post<Usuario>('/usuarios', usuario);
  }

  updateUsuario(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    return this.apiService.put<Usuario>(`/usuarios/${id}`, usuario);
  }

  deleteUsuario(id: number): Promise<null> {
    return this.apiService.delete<null>(`/usuarios/${id}`);
  }

  // Roles
  getRoles(): Promise<Rol[]> {
    return this.apiService.get<Rol[]>('/roles');
  }

  getRol(id: number): Promise<Rol> {
    return this.apiService.get<Rol>(`/roles/${id}`);
  }

  createRol(rol: RolFormData): Promise<Rol> {
    return this.apiService.post<Rol>('/roles', rol);
  }

  updateRol(id: number, rol: RolFormData): Promise<Rol> {
    return this.apiService.put<Rol>(`/roles/${id}`, rol);
  }

  deleteRol(id: number): Promise<null> {
    return this.apiService.delete<null>(`/roles/${id}`);
  }

  // Permisos
  getPermisos(): Promise<Permission[]> {
    return this.apiService.get<Permission[]>('/permisos');
  }

  // Asignar rol a usuario
  asignarRol(usuarioId: number, rolId: number): Promise<any> {
    return this.apiService.post<any>(`/usuarios/${usuarioId}/roles`, {
      role_id: rolId,
    });
  }

  // Remover rol de usuario
  removerRol(usuarioId: number, rolId: number): Promise<null> {
    return this.apiService.delete<null>(
      `/usuarios/${usuarioId}/roles/${rolId}`
    );
  }
}
