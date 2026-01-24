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

    // Versión 1: Esquema original
    this.version(1).stores({
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

    // Manejar error de upgrade - si hay error al abrir, eliminar y recrear la BD
    this.on('blocked', () => {
      console.warn('Database upgrade blocked, please close other tabs');
    });
  }

  /**
   * Elimina y recrea la base de datos
   * Útil cuando hay errores de migración de esquema
   */
  static async resetDatabase(): Promise<void> {
    const dbName = environment.storage.dbName;
    console.warn('🔄 Reseteando base de datos:', dbName);

    try {
      // Eliminar la base de datos
      await Dexie.delete(dbName);
      console.log('✅ Base de datos eliminada correctamente');

      // Recargar la página para recrear la BD con el nuevo esquema
      window.location.reload();
    } catch (error) {
      console.error('❌ Error al eliminar la base de datos:', error);
      throw error;
    }
  }

  /**
   * Verifica si la BD está accesible, si no, la resetea
   */
  async ensureOpen(): Promise<boolean> {
    try {
      if (!this.isOpen()) {
        await this.open();
      }
      return true;
    } catch (error: any) {
      console.error('Error al abrir la base de datos:', error);

      // Si es un error de upgrade, resetear la BD
      if (
        error.name === 'UpgradeError' ||
        error.name === 'DatabaseClosedError' ||
        (error.message && error.message.includes('primary key'))
      ) {
        console.warn(
          '⚠️ Error de migración detectado, reseteando base de datos...',
        );
        await DatabaseService.resetDatabase();
        return false;
      }

      throw error;
    }
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
    const items = await this.inspecciones.toArray();

    // Ordenar por preferencia: fecha_hora_inspeccion, created_at, updated_at (descendente)
    const parseTime = (s?: string) => {
      if (!s) return 0;
      const t = Date.parse(s);
      return isNaN(t) ? 0 : t;
    };

    items.sort((a: any, b: any) => {
      const timeA =
        parseTime(a.fecha_hora_inspeccion) ||
        parseTime(a.created_at) ||
        parseTime(a.updated_at) ||
        0;
      const timeB =
        parseTime(b.fecha_hora_inspeccion) ||
        parseTime(b.created_at) ||
        parseTime(b.updated_at) ||
        0;
      return timeB - timeA;
    });

    return items;
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
      },
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
    inspeccionId: number,
  ): Promise<InspeccionArea[]> {
    return await this.inspeccion_areas
      .where('inspeccion_id')
      .equals(inspeccionId)
      .toArray();
  }

  async saveInspeccionInspectores(
    inspectores: InspeccionInspector[],
  ): Promise<void> {
    await this.inspeccion_inspectores.bulkPut(inspectores);
  }

  async getInspeccionInspectoresByInspeccion(
    inspeccionId: number,
  ): Promise<InspeccionInspector[]> {
    return await this.inspeccion_inspectores
      .where('inspeccion_id')
      .equals(inspeccionId)
      .toArray();
  }

  async saveResultadosInspeccion(
    resultados: ResultadoInspeccion[],
  ): Promise<void> {
    await this.resultados_inspeccion.bulkPut(resultados);
  }

  async updateResultado(resultado: ResultadoInspeccion): Promise<void> {
    if (resultado.id) {
      await this.resultados_inspeccion.put(resultado);
    }
  }

  async getResultadoById(id: number): Promise<ResultadoInspeccion | undefined> {
    return await this.resultados_inspeccion.get(id);
  }

  async getResultadosByInspeccion(
    inspeccionId: number,
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
    inspeccionLocalId: string,
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
    inspeccionLocalId: string,
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
    inspeccionLocalId: string,
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
