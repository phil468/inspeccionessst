export interface Usuario {
  id?: number;
  name: string;
  email: string;
  password?: string;
  microsoft_id?: string;
  avatar?: string;
  activo: number;
  email_verified_at?: string;
  created_at?: string;
  updated_at?: string;
  roles?: Rol[];
}

export interface Rol {
  id?: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id?: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at?: string;
  updated_at?: string;
}

export interface RolFormData {
  name: string;
  description: string;
  permissions: number[];
}
