export interface Registro {
  id?: number;
  local_id: string;
  user_id?: number;
  campania_id: number;
  material_id: number;
  fundo_id: number;
  lote_id: number;
  motivo_id: number;
  cantidad: number;
  numero_tractor?: string;
  observaciones?: string;
  fecha_registro: string;
  synced: boolean;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relaciones (cuando vienen del servidor)
  campania?: any;
  material?: any;
  fundo?: any;
  lote?: any;
  motivo?: any;
  user?: any;
}

export interface RegistroForm {
  campania_id: number;
  material_id: number;
  fundo_id: number;
  lote_id: number;
  motivo_id: number;
  cantidad: number;
  numero_tractor?: string;
  observaciones?: string;
  fecha_registro?: string;
}

export interface EstadisticasRegistro {
  total: number;
  sincronizados: number;
  pendientes: number;
  ultimos_registros: Registro[];
}
