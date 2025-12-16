import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Registro, Campania, Material, Fundo, Lote, Motivo } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService extends Dexie {
  // Tablas
  registros!: Table<Registro, number>;
  campanias!: Table<Campania, number>;
  materiales!: Table<Material, number>;
  fundos!: Table<Fundo, number>;
  lotes!: Table<Lote, number>;
  motivos!: Table<Motivo, number>;

  constructor() {
    super(environment.storage.dbName);

    this.version(environment.storage.dbVersion).stores({
      registros: '++id, local_id, user_id, synced, fecha_registro, created_at',
      campanias: '++id, nombre, activo',
      materiales: '++id, codigo, nombre, activo',
      fundos: '++id, nombre, activo',
      lotes: '++id, fundo_id, codigo, activo',
      motivos: '++id, nombre, activo',
    });
  }

  /**
   * Métodos de acceso para las páginas
   */
  async getCampanias(): Promise<Campania[]> {
    return await this.campanias.toArray();
  }

  async getMateriales(): Promise<Material[]> {
    return await this.materiales.toArray();
  }

  async getFundos(): Promise<Fundo[]> {
    return await this.fundos.toArray();
  }

  async getLotes(): Promise<Lote[]> {
    return await this.lotes.toArray();
  }

  async getMotivos(): Promise<Motivo[]> {
    return await this.motivos.toArray();
  }

  async getRegistros(): Promise<Registro[]> {
    return await this.registros.toArray();
  }

  async saveRegistro(registro: Registro): Promise<number> {
    return await this.registros.add(registro);
  }

  async updateRegistro(registro: any): Promise<void> {
    await this.registros.put(registro);
  }

  /**
   * Limpiar todas las tablas
   */
  async clearAll(): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.registros,
        this.campanias,
        this.materiales,
        this.fundos,
        this.lotes,
        this.motivos,
      ],
      async () => {
        await this.registros.clear();
        await this.campanias.clear();
        await this.materiales.clear();
        await this.fundos.clear();
        await this.lotes.clear();
        await this.motivos.clear();
      }
    );
  }

  /**
   * Obtener tamaño aproximado de la base de datos
   */
  async getDatabaseSize(): Promise<number> {
    const counts = await Promise.all([
      this.registros.count(),
      this.campanias.count(),
      this.materiales.count(),
      this.fundos.count(),
      this.lotes.count(),
      this.motivos.count(),
    ]);

    return counts.reduce((sum, count) => sum + count, 0);
  }
}
