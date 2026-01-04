export interface User {
  id: number;
  name: string;
  email: string;
  microsoft_id: string;
  personal_id?: number;
  avatar?: string;
  activo: boolean;
  roles: Role[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string; // Cambiado de 'nombre' a 'name'
  description?: string; // Cambiado de 'descripcion' a 'description'
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: number;
  name: string; // Cambiado de 'nombre' a 'name'
  description?: string; // Cambiado de 'descripcion' a 'description'
  resource: string; // Agregado
  action: string; // Agregado
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
