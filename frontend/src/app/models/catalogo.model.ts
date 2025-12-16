export interface Campania {
  id: number;
  nombre: string;
  anio_inicio: number;
  anio_fin: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Material {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Fundo {
  id: number;
  nombre: string;
  ubicacion?: string;
  activo: boolean;
  lotes?: Lote[];
  created_at?: string;
  updated_at?: string;
}

export interface Lote {
  id: number;
  fundo_id: number;
  codigo: string;
  nombre: string;
  activo: boolean;
  fundo?: Fundo;
  created_at?: string;
  updated_at?: string;
}

export interface Motivo {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Catalogos {
  campanias: Campania[];
  materiales: Material[];
  fundos: Fundo[];
  lotes: Lote[];
  motivos: Motivo[];
}
