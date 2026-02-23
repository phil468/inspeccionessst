export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  redirect_url?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: any;
    token: string;
    expires_at?: string;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
  };
}

export interface SyncResponse {
  success: boolean;
  message: string;
  data: {
    sincronizados: SyncResult[];
    duplicados: SyncResult[];
    errores: SyncResult[];
  };
  summary: {
    total_recibidos: number;
    sincronizados: number;
    duplicados: number;
    errores: number;
  };
}

export interface SyncResult {
  local_id: string;
  server_id?: number;
  message: string;
  success?: boolean;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export interface SyncStatus {
  total_registros: number;
  sincronizados: number;
  pendientes: number;
  ultima_actualizacion?: string;
  timestamp_servidor: string;
  syncing?: boolean;
  lastSync?: Date | null;
  error?: string | null;
  // Mensaje técnico completo (stack / detalles) para mostrar al usuario o copiar
  error_detail?: string | null;
  pendingCount?: number;
}
