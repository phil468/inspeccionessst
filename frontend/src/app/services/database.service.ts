import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Registro } from '../models/registro.model';
import {
  Inspeccion,
  InspeccionArea,
  InspeccionInspector,
  InspeccionResponsableArea,
  ResultadoInspeccion,
  ResultadoResponsable,
  ResultadoVisor,
  ResultadoResponsableLevantamiento,
  ResponsableRegistro,
} from '../models/inspeccion.model';
import {
  Campania,
  Fundo,
  Empresa,
  Area,
  Personal,
  Cargo,
  TipoDeTrabajador,
  TipoDePersonal,
  Planilla,
} from '../models/catalogo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {
  // Tablas
  registros!: Table<Registro, number>;
  inspecciones!: Table<Inspeccion, number>;
  inspeccion_areas!: Table<InspeccionArea, number>;
  inspeccion_inspectores!: Table<InspeccionInspector, number>;
  inspeccion_responsables_area!: Table<InspeccionResponsableArea, number>;
  resultados_inspeccion!: Table<ResultadoInspeccion, number>;
  resultado_responsables!: Table<ResultadoResponsable, number>;
  resultado_visores!: Table<ResultadoVisor, number>;
  resultado_responsables_levantamiento!: Table<
    ResultadoResponsableLevantamiento,
    number
  >;
  responsable_registro!: Table<ResponsableRegistro, number>;
  campanias!: Table<Campania, number>;
  fundos!: Table<Fundo, number>;
  empresas!: Table<Empresa, number>;
  areas!: Table<Area, number>;
  personal!: Table<Personal, number>;
  cargos!: Table<Cargo, number>;
  tipos_trabajador!: Table<TipoDeTrabajador, number>;
  tipos_personal!: Table<TipoDePersonal, number>;
  planillas!: Table<Planilla, number>;
  tiposDePuesto!: Table<any, number>;
  nivelesJerarquicos!: Table<any, number>;

  constructor() {
    super(environment.storage.dbName);

    this.version(environment.storage.dbVersion).stores({
      registros: '++id, local_id, user_id, synced, fecha_registro, created_at',
      inspecciones:
        '++id, local_id, user_id, empresa_id, area_id, synced, fecha_inspeccion, created_at',
      inspeccion_areas: '++id, local_id, inspeccion_id, area_id',
      inspeccion_inspectores: '++id, local_id, inspeccion_id, personal_id',
      inspeccion_responsables_area:
        '++id, local_id, inspeccion_id, area_id, personal_id',
      resultados_inspeccion:
        '++id, local_id, inspeccion_id, responsable_id, synced, estado, nivel_riesgo',
      resultado_responsables: '++id, local_id, resultado_id, personal_id',
      resultado_visores: '++id, local_id, resultado_id, personal_id',
      resultado_responsables_levantamiento:
        '++id, local_id, resultado_id, personal_id',
      responsable_registro: '++id, local_id, inspeccion_id, personal_id',
      campanias: '++id, nombre, activo',
      fundos: '++id, nombre, activo',
      empresas: '++id, name, activo',
      areas: '++id, empresa_id, name, activo',
      personal:
        '++id, dni, name, empresa_id, area_id, cargo_id, cesado, seleccionado, inspector',
      cargos: '++id, empresa_id, name, activo, tipo_de_puesto_id, reporta_a',
      tipos_trabajador: '++id, empresa_id, name, estado',
      tipos_personal: '++id, empresa_id, name, estado',
      planillas: '++id, empresa_id, name, estado',
      tiposDePuesto: '++id, name, estado, nivel_jerarquico_id',
      nivelesJerarquicos: '++id, name, estado',
    });
  }

  /**
   * Métodos de acceso para las páginas
   */
  async getCampanias(): Promise<Campania[]> {
    return await this.campanias.toArray();
  }

  async getFundos(): Promise<Fundo[]> {
    return await this.fundos.toArray();
  }

  async getEmpresas(): Promise<Empresa[]> {
    return await this.empresas.toArray();
  }

  async getAreas(): Promise<Area[]> {
    return await this.areas.toArray();
  }

  async getAreasByEmpresa(empresaId: number): Promise<Area[]> {
    return await this.areas.where('empresa_id').equals(empresaId).toArray();
  }

  async getRegistros(): Promise<Registro[]> {
    return await this.registros.toArray();
  }

  async getInspecciones(): Promise<Inspeccion[]> {
    return await this.inspecciones.toArray();
  }

  async saveRegistro(registro: Registro): Promise<number> {
    return await this.registros.add(registro);
  }

  async saveInspeccion(inspeccion: Inspeccion): Promise<number> {
    return await this.inspecciones.add(inspeccion);
  }

  async updateRegistro(registro: any): Promise<void> {
    await this.registros.put(registro);
  }

  async updateInspeccion(inspeccion: any): Promise<void> {
    await this.inspecciones.put(inspeccion);
  }

  /**
   * Limpiar todas las tablas
   */
  async clearAll(): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.registros,
        this.inspecciones,
        this.inspeccion_areas,
        this.inspeccion_inspectores,
        this.inspeccion_responsables_area,
        this.resultados_inspeccion,
        this.resultado_responsables,
        this.responsable_registro,
        this.campanias,
        this.fundos,
        this.empresas,
        this.areas,
        this.cargos,
        this.tipos_trabajador,
        this.tipos_personal,
        this.planillas,
      ],
      async () => {
        await this.registros.clear();
        await this.inspecciones.clear();
        await this.inspeccion_areas.clear();
        await this.inspeccion_inspectores.clear();
        await this.inspeccion_responsables_area.clear();
        await this.resultados_inspeccion.clear();
        await this.resultado_responsables.clear();
        await this.responsable_registro.clear();
        await this.campanias.clear();
        await this.fundos.clear();
        await this.empresas.clear();
        await this.areas.clear();
        await this.cargos.clear();
        await this.tipos_trabajador.clear();
        await this.tipos_personal.clear();
        await this.planillas.clear();
      }
    );
  }

  /**
   * Obtener tamaño aproximado de la base de datos
   */
  async getDatabaseSize(): Promise<number> {
    const counts = await Promise.all([
      this.registros.count(),
      this.inspecciones.count(),
      this.inspeccion_areas.count(),
      this.inspeccion_inspectores.count(),
      this.resultados_inspeccion.count(),
      this.campanias.count(),
      this.fundos.count(),
      this.empresas.count(),
      this.areas.count(),
      this.cargos.count(),
      this.tipos_trabajador.count(),
      this.tipos_personal.count(),
      this.planillas.count(),
    ]);

    return counts.reduce((sum, count) => sum + count, 0);
  }

  // ==================== MÉTODOS PARA TABLAS RELACIONADAS ====================

  async saveInspeccionAreas(inspeccionAreas: InspeccionArea[]): Promise<void> {
    await this.inspeccion_areas.bulkPut(inspeccionAreas);
  }

  async getInspeccionAreasByInspeccion(
    inspeccionId: number
  ): Promise<InspeccionArea[]> {
    return await this.inspeccion_areas
      .where('inspeccion_id')
      .equals(inspeccionId)
      .toArray();
  }

  async saveInspeccionInspectores(
    inspectores: InspeccionInspector[]
  ): Promise<void> {
    await this.inspeccion_inspectores.bulkPut(inspectores);
  }

  async getInspeccionInspectoresByInspeccion(
    inspeccionId: number
  ): Promise<InspeccionInspector[]> {
    return await this.inspeccion_inspectores
      .where('inspeccion_id')
      .equals(inspeccionId)
      .toArray();
  }

  async saveResultadosInspeccion(
    resultados: ResultadoInspeccion[]
  ): Promise<void> {
    await this.resultados_inspeccion.bulkPut(resultados);
  }

  async getResultadosByInspeccion(
    inspeccionId: number
  ): Promise<ResultadoInspeccion[]> {
    return await this.resultados_inspeccion
      .where('inspeccion_id')
      .equals(inspeccionId)
      .toArray();
  }

  async getPendingResultados(): Promise<ResultadoInspeccion[]> {
    return await this.resultados_inspeccion
      .filter((r) => r.synced === false || r.synced === null)
      .toArray();
  }

  // ========== MÉTODOS PARA BUSCAR RELACIONES POR LOCAL_ID ==========
  async getInspeccionAreasByLocalId(
    inspeccionLocalId: string
  ): Promise<InspeccionArea[]> {
    // Buscar primero la inspección por local_id para obtener su ID de IndexedDB
    const inspeccion = await this.inspecciones
      .where('local_id')
      .equals(inspeccionLocalId)
      .first();

    if (!inspeccion || !inspeccion.id) {
      return [];
    }

    return await this.inspeccion_areas
      .where('inspeccion_id')
      .equals(inspeccion.id)
      .toArray();
  }

  async getInspeccionInspectoresByLocalId(
    inspeccionLocalId: string
  ): Promise<InspeccionInspector[]> {
    const inspeccion = await this.inspecciones
      .where('local_id')
      .equals(inspeccionLocalId)
      .first();

    if (!inspeccion || !inspeccion.id) {
      return [];
    }

    return await this.inspeccion_inspectores
      .where('inspeccion_id')
      .equals(inspeccion.id)
      .toArray();
  }

  async getResultadosByLocalId(
    inspeccionLocalId: string
  ): Promise<ResultadoInspeccion[]> {
    const inspeccion = await this.inspecciones
      .where('local_id')
      .equals(inspeccionLocalId)
      .first();

    if (!inspeccion || !inspeccion.id) {
      return [];
    }

    return await this.resultados_inspeccion
      .where('inspeccion_id')
      .equals(inspeccion.id)
      .toArray();
  }
}
