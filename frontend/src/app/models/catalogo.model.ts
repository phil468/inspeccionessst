export interface Campania {
  id: number;
  nombre: string;
  anio_inicio: number;
  anio_fin: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Fundo {
  id: number;
  nombre: string;
  ubicacion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Empresa {
  id: number;
  name: string;
  razon_social?: string;
  ruc?: string;
  domicilio?: string;
  actividad_economica?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Area {
  id: number;
  empresa_id: number;
  name: string;
  centro_costo?: string;
  activo: boolean;
  empresa?: Empresa;
  created_at?: string;
  updated_at?: string;
}

export interface Cargo {
  id: number;
  name: string;
  idcargo_nisira?: string;
  empresa_id?: number;
  tipo_de_puesto_id?: number;
  reporta_a?: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipoDePuesto {
  id: number;
  name: string;
  nivel_jerarquico_id?: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NivelJerarquico {
  id: number;
  name: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipoDeTrabajador {
  id: number;
  name: string;
  idtipotrabajador_nisira?: string;
  empresa_id?: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TipoDePersonal {
  id: number;
  name: string;
  idtipopersonal_nisira?: string;
  empresa_id?: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Planilla {
  id: number;
  name: string;
  idplanilla_nisira?: string;
  empresa_id?: number;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Personal {
  id?: number;
  dni: string;
  name: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string;
  empresa_id?: number;
  area_id?: number;
  cargo_id?: number;
  tipo_de_trabajador_id?: number;
  tipo_de_personal_id?: number;
  planilla_id?: number;
  reporta_a?: number;
  correo_empresa?: string;
  celular_empresa?: string;
  genero?: 'M' | 'F';
  sexo?: 'M' | 'F';
  fecha_ingreso?: string;
  fecha_cese?: string;
  estado: boolean;
  seleccionado: boolean;
  cesado: boolean;
  importado?: boolean;
  inspector?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones
  empresa?: Empresa;
  area?: Area;
  cargo?: Cargo;
  tipo_de_trabajador?: TipoDeTrabajador;
  tipo_de_personal?: TipoDePersonal;
  planilla?: Planilla;
  reporta_a_personal?: Personal;
}

export interface Catalogos {
  campanias: Campania[];
  fundos: Fundo[];
  empresas: Empresa[];
  areas: Area[];
  cargos: Cargo[];
  tipos_trabajador: TipoDeTrabajador[];
  tipos_personal: TipoDePersonal[];
  planillas: Planilla[];
  personal?: Personal[];
}
