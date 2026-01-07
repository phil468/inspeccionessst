import { Empresa, Area, Personal } from './catalogo.model';

export type TipoInspeccion = 'Planeada' | 'No Planeada' | 'Otro';
export type NivelRiesgo = 'Alto' | 'Medio' | 'Bajo';
export type EstadoResultado =
  | 'Buena Práctica'
  | 'Cumplimiento'
  | 'Pendiente'
  | 'Ejecutado';

// Tabla pivot: inspección -> áreas
export interface InspeccionArea {
  id?: number;
  local_id: string;
  inspeccion_id: number;
  area_id: number;
  area?: Area;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Tabla pivot: inspección -> inspectores
export interface InspeccionInspector {
  id?: number;
  local_id: string;
  inspeccion_id: number;
  personal_id: number;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Responsables de área
export interface InspeccionResponsableArea {
  id?: number;
  local_id: string;
  inspeccion_id: number;
  area_id: number;
  personal_id: number;
  area?: Area;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Resultado/Hallazgo de inspección
export interface ResultadoInspeccion {
  id?: number;
  local_id: string;
  inspeccion_id: number;
  responsable_id?: number;
  descripcion: string;
  registro_fotografico_inicial?: string;
  foto_inicial_estado?: 'pendiente' | 'aprobada' | 'rechazada';
  foto_inicial_comentario?: string;
  foto_inicial_aprobador_id?: number;
  foto_inicial_aprobada_at?: string;
  nivel_riesgo: NivelRiesgo;
  accion_tomar?: string;
  estado: EstadoResultado;
  fecha_cierre?: string;
  registro_fotografico_final?: string;
  foto_final_estado?: 'pendiente' | 'aprobada' | 'rechazada';
  foto_final_comentario?: string;
  foto_final_aprobador_id?: number;
  foto_final_aprobada_at?: string;
  synced: boolean;
  synced_at?: string;
  // Relaciones
  responsable?: Personal;
  visores?: ResultadoVisor[];
  responsablesLevantamiento?: ResultadoResponsableLevantamiento[];
  fotoInicialAprobador?: Personal;
  fotoFinalAprobador?: Personal;
  responsables?: ResultadoResponsable[]; // Legacy
  created_at?: string;
  updated_at?: string;
}

// Visor del resultado (solo lectura)
export interface ResultadoVisor {
  id?: number;
  local_id: string;
  resultado_id: number;
  personal_id: number;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Responsable de levantamiento del resultado
export interface ResultadoResponsableLevantamiento {
  id?: number;
  local_id: string;
  resultado_id: number;
  personal_id: number;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Responsables de levantamiento/corrección (Legacy)
export interface ResultadoResponsable {
  id?: number;
  local_id: string;
  resultado_id: number;
  personal_id: number;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Responsable del registro (firma)
export interface ResponsableRegistro {
  id?: number;
  local_id: string;
  inspeccion_id: number;
  personal_id: number;
  fecha_firma?: string;
  firma_digital?: string;
  personal?: Personal;
  synced?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inspeccion {
  id?: number;
  local_id: string;
  user_id: number;
  empresa_id: number;
  area_id?: number | null; // Ahora es opcional para compatibilidad (se usa relación areas[])
  tipo_inspeccion: TipoInspeccion;
  tipo_inspeccion_otro?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;

  // Snapshot de datos de empresa (para histórico)
  razon_social?: string;
  ruc?: string;
  domicilio?: string;
  actividad_economica?: string;

  // Datos de la inspección
  zona_inspeccionada?: string;
  numero_registro: string; // Ahora es requerido
  fecha_hora_inspeccion?: string;
  comentario?: string;
  objetivo?: string;
  descripcion_causa?: string;
  conclusiones_recomendaciones?: string;

  // Control de sincronización
  synced: boolean;
  synced_at?: string;

  // Relaciones (para visualización)
  empresa?: Empresa;
  area?: Area;
  areas?: InspeccionArea[]; // Múltiples áreas
  inspectores?: InspeccionInspector[]; // Múltiples inspectores
  responsables_area?: InspeccionResponsableArea[];
  resultados?: ResultadoInspeccion[];
  responsable_registro?: ResponsableRegistro;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// Formato simplificado para sincronización con el servidor
export interface InspeccionSync
  extends Omit<Inspeccion, 'areas' | 'inspectores' | 'resultados'> {
  areas?: { area_id: number }[];
  inspectores?: { personal_id: number }[];
  resultados?: ResultadoInspeccion[];
}
