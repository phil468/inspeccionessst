import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import {
  Registro,
  Campania,
  Material,
  Fundo,
  Lote,
  Motivo,
  Catalogos,
} from '../models';

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

  // ==================== CATÁLOGOS ====================

  /**
   * Guardar catálogos completos
   */
  async saveCatalogos(catalogos: Catalogos): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.campanias,
        this.db.materiales,
        this.db.fundos,
        this.db.lotes,
        this.db.motivos,
      ],
      async () => {
        // Limpiar catálogos existentes
        await this.db.campanias.clear();
        await this.db.materiales.clear();
        await this.db.fundos.clear();
        await this.db.lotes.clear();
        await this.db.motivos.clear();

        // Guardar nuevos catálogos
        if (catalogos.campanias && catalogos.campanias.length > 0) {
          await this.db.campanias.bulkAdd(catalogos.campanias);
        }
        if (catalogos.materiales && catalogos.materiales.length > 0) {
          await this.db.materiales.bulkAdd(catalogos.materiales);
        }
        if (catalogos.fundos && catalogos.fundos.length > 0) {
          // Los fundos pueden venir con lotes anidados, extraerlos
          const lotes: any[] = [];
          const fundosSinLotes = catalogos.fundos.map((fundo: any) => {
            // Extraer lotes del fundo
            if (fundo.lotes && Array.isArray(fundo.lotes)) {
              lotes.push(...fundo.lotes);
            }
            // Retornar fundo sin la propiedad lotes
            const { lotes: _, ...fundoSinLotes } = fundo;
            return fundoSinLotes;
          });

          await this.db.fundos.bulkAdd(fundosSinLotes);

          // Guardar lotes extraídos
          if (lotes.length > 0) {
            await this.db.lotes.bulkAdd(lotes);
          }
        }

        // Si vienen lotes por separado (fallback)
        if (catalogos.lotes && catalogos.lotes.length > 0) {
          await this.db.lotes.bulkAdd(catalogos.lotes);
        }

        if (catalogos.motivos && catalogos.motivos.length > 0) {
          await this.db.motivos.bulkAdd(catalogos.motivos);
        }
      }
    );
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
   * Obtener todos los materiales
   */
  async getMateriales(): Promise<Material[]> {
    return await this.db.materiales.toArray();
  }

  /**
   * Obtener materiales activos
   */
  async getActiveMateriales(): Promise<Material[]> {
    return await this.db.materiales.filter((m) => m.activo === true).toArray();
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
   * Obtener lotes por fundo
   */
  async getLotesByFundo(fundoId: number): Promise<Lote[]> {
    return await this.db.lotes
      .filter((l) => l.fundo_id === fundoId && l.activo === true)
      .toArray();
  }

  /**
   * Obtener todos los lotes
   */
  async getLotes(): Promise<Lote[]> {
    return await this.db.lotes.toArray();
  }

  /**
   * Obtener todos los motivos
   */
  async getMotivos(): Promise<Motivo[]> {
    return await this.db.motivos.toArray();
  }

  /**
   * Obtener motivos activos
   */
  async getActiveMotivos(): Promise<Motivo[]> {
    return await this.db.motivos.filter((m) => m.activo === true).toArray();
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
      this.db.materiales.count(),
      this.db.fundos.count(),
      this.db.lotes.count(),
      this.db.motivos.count(),
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
   * Actualizar solo materiales
   */
  async updateMateriales(materiales: Material[]): Promise<void> {
    await this.db.transaction('rw', [this.db.materiales], async () => {
      await this.db.materiales.clear();
      if (materiales.length > 0) {
        await this.db.materiales.bulkAdd(materiales);
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

  /**
   * Actualizar solo lotes
   */
  async updateLotes(lotes: Lote[]): Promise<void> {
    await this.db.transaction('rw', [this.db.lotes], async () => {
      await this.db.lotes.clear();
      if (lotes.length > 0) {
        await this.db.lotes.bulkAdd(lotes);
      }
    });
  }

  /**
   * Actualizar solo motivos
   */
  async updateMotivos(motivos: Motivo[]): Promise<void> {
    await this.db.transaction('rw', [this.db.motivos], async () => {
      await this.db.motivos.clear();
      if (motivos.length > 0) {
        await this.db.motivos.bulkAdd(motivos);
      }
    });
  }
}
