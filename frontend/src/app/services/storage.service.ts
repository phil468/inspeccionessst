import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Registro } from '../models/registro.model';
import { Inspeccion } from '../models/inspeccion.model';
import {
  Campania,
  Fundo,
  Empresa,
  Area,
  Catalogos,
  Personal,
} from '../models/catalogo.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private db: DatabaseService) {}

  // ==================== REGISTROS ====================

  /**
   * Guardar un registro en la base de datos local
   */
  async saveRegistro(registro: Registro): Promise<number> {
    return await this.db.registros.add(registro);
  }

  /**
   * Guardar múltiples registros (actualiza si existe, inserta si no)
   */
  async saveRegistros(registros: Registro[]): Promise<void> {
    await this.db.registros.bulkPut(registros);
  }

  /**
   * Obtener todos los registros
   */
  async getAllRegistros(): Promise<Registro[]> {
    return await this.db.registros.toArray();
  }

  /**
   * Obtener registros pendientes de sincronización
   */
  async getPendingRegistros(): Promise<Registro[]> {
    return await this.db.registros
      .filter((r) => r.synced === false || r.synced === null)
      .toArray();
  }

  /**
   * Obtener un registro por local_id
   */
  async getRegistroByLocalId(localId: string): Promise<Registro | undefined> {
    return await this.db.registros
      .filter((r) => r.local_id === localId)
      .first();
  }

  /**
   * Actualizar un registro
   */
  async updateRegistro(
    id: number,
    changes: Partial<Registro>
  ): Promise<number> {
    return await this.db.registros.update(id, changes);
  }

  /**
   * Marcar registro como sincronizado
   */
  async markRegistroAsSynced(
    localId: string,
    serverId?: number
  ): Promise<number> {
    const registro = await this.getRegistroByLocalId(localId);
    if (!registro) {
      throw new Error('Registro no encontrado con local_id: ' + localId);
    }

    // Encontrar la clave primaria de IndexedDB
    const dbKey = await this.db.registros
      .where('local_id')
      .equals(localId)
      .primaryKeys()
      .then((keys) => keys[0]);

    if (!dbKey) {
      throw new Error('No se encontró la clave primaria para el registro');
    }

    // Actualizar solo synced, no tocar la clave primaria
    return await this.db.registros.update(dbKey, {
      synced: true,
      synced_at: new Date().toISOString(),
    });
  }

  /**
   * Eliminar un registro
   */
  async deleteRegistro(id: number): Promise<void> {
    await this.db.registros.delete(id);
  }

  /**
   * Contar registros pendientes
   */
  async countPendingRegistros(): Promise<number> {
    return await this.db.registros
      .filter((r) => r.synced === false || r.synced === null)
      .count();
  }

  /**
   * Contar total de registros
   */
  async countRegistros(): Promise<number> {
    return await this.db.registros.count();
  }

  // ==================== INSPECCIONES ====================

  /**
   * Guardar una inspección en la base de datos local
   */
  async saveInspeccion(inspeccion: Inspeccion): Promise<number> {
    return await this.db.inspecciones.add(inspeccion);
  }

  /**
   * Guardar múltiples inspecciones (actualiza si existe, inserta si no)
   */
  async saveInspecciones(inspecciones: Inspeccion[]): Promise<void> {
    await this.db.inspecciones.bulkPut(inspecciones);
  }

  /**
   * Obtener todas las inspecciones
   */
  async getAllInspecciones(): Promise<Inspeccion[]> {
    return await this.db.inspecciones.toArray();
  }

  /**
   * Obtener inspecciones pendientes de sincronización
   */
  async getPendingInspecciones(): Promise<Inspeccion[]> {
    return await this.db.inspecciones
      .filter((i) => i.synced === false || i.synced === null)
      .toArray();
  }

  /**
   * Obtener una inspección por local_id
   */
  async getInspeccionByLocalId(
    localId: string
  ): Promise<Inspeccion | undefined> {
    return await this.db.inspecciones
      .filter((i) => i.local_id === localId)
      .first();
  }

  /**
   * Actualizar una inspección
   */
  async updateInspeccion(
    id: number,
    changes: Partial<Inspeccion>
  ): Promise<number> {
    return await this.db.inspecciones.update(id, changes);
  }

  /**
   * Marcar inspección como sincronizada
   */
  async markInspeccionAsSynced(
    localId: string,
    serverId?: number
  ): Promise<number> {
    const inspeccion = await this.getInspeccionByLocalId(localId);
    if (!inspeccion) {
      throw new Error('Inspección no encontrada con local_id: ' + localId);
    }

    // Encontrar la clave primaria de IndexedDB
    const dbKey = await this.db.inspecciones
      .where('local_id')
      .equals(localId)
      .primaryKeys()
      .then((keys) => keys[0]);

    if (!dbKey) {
      throw new Error('No se encontró la clave primaria para la inspección');
    }

    // Actualizar solo synced, no tocar la clave primaria
    return await this.db.inspecciones.update(dbKey, {
      synced: true,
      synced_at: new Date().toISOString(),
    });
  }

  /**
   * Eliminar una inspección
   */
  async deleteInspeccion(id: number): Promise<void> {
    await this.db.inspecciones.delete(id);
  }

  /**
   * Contar inspecciones pendientes
   */
  async countPendingInspecciones(): Promise<number> {
    return await this.db.inspecciones
      .filter((i) => i.synced === false || i.synced === null)
      .count();
  }

  /**
   * Contar total de inspecciones
   */
  async countInspecciones(): Promise<number> {
    return await this.db.inspecciones.count();
  }

  // ==================== CATÁLOGOS ====================

  /**
   * Guardar catálogos completos
   */
  async saveCatalogos(catalogos: Catalogos): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.campanias,
        this.db.fundos,
        this.db.empresas,
        this.db.areas,
        this.db.cargos,
        this.db.tipos_trabajador,
        this.db.tipos_personal,
        this.db.planillas,
        this.db.personal,
      ],
      async () => {
        // Limpiar catálogos existentes
        await this.db.campanias.clear();
        await this.db.fundos.clear();
        await this.db.empresas.clear();
        await this.db.areas.clear();
        await this.db.cargos.clear();
        await this.db.tipos_trabajador.clear();
        await this.db.tipos_personal.clear();
        await this.db.planillas.clear();
        await this.db.personal.clear();

        // Guardar nuevos catálogos
        if (catalogos.campanias && catalogos.campanias.length > 0) {
          await this.db.campanias.bulkAdd(catalogos.campanias);
        }
        if (catalogos.fundos && catalogos.fundos.length > 0) {
          await this.db.fundos.bulkAdd(catalogos.fundos);
        }
        if (catalogos.empresas && catalogos.empresas.length > 0) {
          await this.db.empresas.bulkAdd(catalogos.empresas);
        }
        if (catalogos.areas && catalogos.areas.length > 0) {
          await this.db.areas.bulkAdd(catalogos.areas);
        }
        if (catalogos.cargos && catalogos.cargos.length > 0) {
          await this.db.cargos.bulkAdd(catalogos.cargos);
        }
        if (
          catalogos.tipos_trabajador &&
          catalogos.tipos_trabajador.length > 0
        ) {
          await this.db.tipos_trabajador.bulkAdd(catalogos.tipos_trabajador);
        }
        if (catalogos.tipos_personal && catalogos.tipos_personal.length > 0) {
          await this.db.tipos_personal.bulkAdd(catalogos.tipos_personal);
        }
        if (catalogos.planillas && catalogos.planillas.length > 0) {
          await this.db.planillas.bulkAdd(catalogos.planillas);
        }
        // Guardar personal
        if (catalogos.personal && catalogos.personal.length > 0) {
          await this.db.personal.bulkAdd(catalogos.personal);
          console.log(`📥 ${catalogos.personal.length} personal guardado`);
        }
      }
    );
  }

  /**
   * Obtener todos los catálogos
   */
  async getCatalogos(): Promise<Catalogos> {
    return {
      campanias: await this.getCampanias(),
      fundos: await this.getFundos(),
      empresas: await this.getEmpresas(),
      areas: await this.getAreas(),
      cargos: await this.db.cargos.toArray(),
      tipos_trabajador: await this.db.tipos_trabajador.toArray(),
      tipos_personal: await this.db.tipos_personal.toArray(),
      planillas: await this.db.planillas.toArray(),
    };
  }

  /**
   * Obtener todas las campañas
   */
  async getCampanias(): Promise<Campania[]> {
    return await this.db.campanias.toArray();
  }

  /**
   * Obtener campañas activas
   */
  async getActiveCampanias(): Promise<Campania[]> {
    return await this.db.campanias.filter((c) => c.activo === true).toArray();
  }

  /**
   * Obtener todos los fundos
   */
  async getFundos(): Promise<Fundo[]> {
    return await this.db.fundos.toArray();
  }

  /**
   * Obtener fundos activos
   */
  async getActiveFundos(): Promise<Fundo[]> {
    return await this.db.fundos.filter((f) => f.activo === true).toArray();
  }

  /**
   * Obtener todas las empresas
   */
  async getEmpresas(): Promise<Empresa[]> {
    return await this.db.empresas.toArray();
  }

  /**
   * Obtener empresas activas
   */
  async getActiveEmpresas(): Promise<Empresa[]> {
    return await this.db.empresas.filter((e) => e.activo === true).toArray();
  }

  /**
   * Obtener todas las áreas
   */
  async getAreas(): Promise<Area[]> {
    return await this.db.areas.toArray();
  }

  /**
   * Obtener áreas activas
   */
  async getActiveAreas(): Promise<Area[]> {
    return await this.db.areas.filter((a) => a.activo === true).toArray();
  }

  /**
   * Obtener áreas por empresa
   */
  async getAreasByEmpresa(empresaId: number): Promise<Area[]> {
    return await this.db.areas
      .filter((a) => a.empresa_id === empresaId && a.activo === true)
      .toArray();
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpiar toda la base de datos
   */
  async clearAll(): Promise<void> {
    await this.db.clearAll();
  }

  /**
   * Obtener tamaño de la base de datos
   */
  async getDatabaseSize(): Promise<number> {
    return await this.db.getDatabaseSize();
  }

  /**
   * Verificar si hay catálogos en la base de datos
   */
  async hasCatalogos(): Promise<boolean> {
    const counts = await Promise.all([
      this.db.campanias.count(),
      this.db.fundos.count(),
      this.db.empresas.count(),
      this.db.areas.count(),
    ]);

    return counts.some((count) => count > 0);
  }

  /**
   * Actualizar solo campañas
   */
  async updateCampanias(campanias: Campania[]): Promise<void> {
    await this.db.transaction('rw', [this.db.campanias], async () => {
      await this.db.campanias.clear();
      if (campanias.length > 0) {
        await this.db.campanias.bulkAdd(campanias);
      }
    });
  }

  /**
   * Actualizar solo fundos
   */
  async updateFundos(fundos: Fundo[]): Promise<void> {
    await this.db.transaction('rw', [this.db.fundos], async () => {
      await this.db.fundos.clear();
      if (fundos.length > 0) {
        await this.db.fundos.bulkAdd(fundos);
      }
    });
  }

  // ==================== PERSONAL ====================

  /**
   * Guardar múltiples registros de personal
   */
  async savePersonal(personal: Personal[]): Promise<void> {
    await this.db.personal.bulkPut(personal);
  }

  /**
   * Obtener todo el personal
   */
  async getAllPersonal(): Promise<Personal[]> {
    return await this.db.personal.toArray();
  }

  /**
   * Obtener personal por ID
   */
  async getPersonalById(id: number): Promise<Personal | undefined> {
    return await this.db.personal.get(id);
  }

  /**
   * Obtener personal activo (no cesado)
   */
  async getActivePersonal(): Promise<Personal[]> {
    return await this.db.personal.filter((p) => !p.cesado).toArray();
  }

  /**
   * Obtener personal por empresa
   */
  async getPersonalByEmpresa(empresaId: number): Promise<Personal[]> {
    return await this.db.personal
      .where('empresa_id')
      .equals(empresaId)
      .toArray();
  }

  /**
   * Obtener personal por DNI
   */
  async getPersonalByDni(dni: string): Promise<Personal | undefined> {
    return await this.db.personal.where('dni').equals(dni).first();
  }

  /**
   * Buscar personal por nombre
   */
  async searchPersonal(query: string): Promise<Personal[]> {
    const lowerQuery = query.toLowerCase();
    return await this.db.personal
      .filter((p) => p.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }

  /**
   * Contar personal activo
   */
  async countActivePersonal(): Promise<number> {
    return await this.db.personal.filter((p) => !p.cesado).count();
  }

  /**
   * Limpiar tabla de personal
   */
  async clearPersonal(): Promise<void> {
    await this.db.personal.clear();
  }
}
