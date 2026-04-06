import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  interval,
  Subscription,
  Subject,
} from 'rxjs';
import { Network } from '@capacitor/network';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { Registro, NetworkStatus, SyncStatus, SyncResult } from '../models';
import { InspeccionSync } from '../models/inspeccion.model';
import { environment } from '../../environments/environment';

export interface SyncConflict {
  local_id: string;
  server_id: number;
  message: string;
  server_updated_at: string;
  client_updated_at: string;
  registro?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private networkStatusSubject: BehaviorSubject<NetworkStatus>;
  public networkStatus$: Observable<NetworkStatus>;

  private syncStatusSubject: BehaviorSubject<SyncStatus>;
  public syncStatus$: Observable<SyncStatus>;

  private conflictsSubject: Subject<SyncConflict[]>;
  public conflicts$: Observable<SyncConflict[]>;

  private autoSyncSubscription?: Subscription;
  private readonly autoSyncInterval = environment.sync.autoSyncInterval;

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private databaseService: DatabaseService,
    private authService: AuthService,
  ) {
    // Inicializar estado de red
    this.networkStatusSubject = new BehaviorSubject<NetworkStatus>({
      connected: true,
      connectionType: 'unknown',
    });
    this.networkStatus$ = this.networkStatusSubject.asObservable();

    // Inicializar estado de sincronización
    this.syncStatusSubject = new BehaviorSubject<SyncStatus>({
      total_registros: 0,
      sincronizados: 0,
      pendientes: 0,
      timestamp_servidor: new Date().toISOString(),
      syncing: false,
      lastSync: null,
      error: null,
      pendingCount: 0,
    });
    this.syncStatus$ = this.syncStatusSubject.asObservable();

    this.conflictsSubject = new Subject<SyncConflict[]>();
    this.conflicts$ = this.conflictsSubject.asObservable();

    this.initializeNetworkListener();
    this.loadSyncStatus();
  }

  /**
   * Inicializar listener de cambios de red
   */
  private async initializeNetworkListener(): Promise<void> {
    // Obtener estado inicial
    const status = await Network.getStatus();
    this.updateNetworkStatus({
      connected: status.connected,
      connectionType: status.connectionType,
    });

    // Escuchar cambios de red
    Network.addListener('networkStatusChange', (status) => {
      this.updateNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType,
      });

      // Si volvemos a estar online, intentar sincronizar
      if (status.connected && this.authService.isAuthenticated) {
        this.syncAll();
      }
    });
  }

  /**
   * Actualizar estado de red
   */
  private updateNetworkStatus(status: NetworkStatus): void {
    this.networkStatusSubject.next(status);
  }

  /**
   * Obtener estado actual de red
   */
  get isOnline(): boolean {
    return this.networkStatusSubject.value.connected;
  }

  /**
   * Cargar estado de sincronización desde localStorage
   */
  private loadSyncStatus(): void {
    const lastSyncStr = localStorage.getItem('last_sync');
    if (lastSyncStr) {
      this.updateSyncStatus({
        ...this.syncStatusSubject.value,
        lastSync: new Date(lastSyncStr),
      });
    }
  }

  /**
   * Actualizar estado de sincronización
   */
  private updateSyncStatus(status: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    const newStatus = { ...currentStatus, ...status };
    this.syncStatusSubject.next(newStatus);

    // Guardar última sincronización
    if (newStatus.lastSync) {
      localStorage.setItem('last_sync', newStatus.lastSync.toISOString());
    }
  }

  /**
   * Iniciar sincronización automática
   */
  startAutoSync(): void {
    if (this.autoSyncSubscription) {
      console.log('⚠️ Auto-sync ya está activo');
      return; // Ya está iniciada
    }

    this.autoSyncSubscription = interval(this.autoSyncInterval).subscribe(
      () => {
        const now = new Date().toLocaleTimeString();
        console.log(`⏰ [${now}] Auto-sync ejecutándose...`);

        if (this.isOnline && this.authService.isAuthenticated) {
          console.log('✅ Condiciones OK - Sincronizando');
          this.syncAll();
        } else {
          console.log(
            `❌ No sincroniza - Online: ${this.isOnline}, Auth: ${this.authService.isAuthenticated}`,
          );
        }
      },
    );

    const intervalMinutes = this.autoSyncInterval / 60000;
    console.log(`✅ Auto-sync iniciado (cada ${intervalMinutes} minutos)`);
    console.log(`⏱️ Próxima sincronización en ${intervalMinutes} minutos`);
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync(): void {
    if (this.autoSyncSubscription) {
      this.autoSyncSubscription.unsubscribe();
      this.autoSyncSubscription = undefined;
      console.log('Auto-sync detenido');
    }
  }

  /**
   * Sincronizar todos los datos
   */
  async syncAll(): Promise<SyncResult> {
    const now = new Date().toLocaleTimeString();
    console.log(`🔄 [${now}] Iniciando sincronización completa...`);

    if (!this.isOnline) {
      console.log('❌ Sin conexión a internet');
      return {
        success: false,
        message: 'No hay conexión a internet',
        local_id: '',
      };
    }

    if (!this.authService.isAuthenticated) {
      console.log('❌ Usuario no autenticado');
      return {
        success: false,
        message: 'Usuario no autenticado',
        local_id: '',
      };
    }

    this.updateSyncStatus({ syncing: true, error: null });

    try {
      // 1. Sincronizar registros pendientes (upload)
      console.log('📤 Sincronizando registros pendientes...');
      await this.syncRegistros();

      // 2. Sincronizar inspecciones pendientes (upload)
      console.log('📤 Sincronizando inspecciones pendientes...');
      await this.syncInspecciones();

      // 3. Descargar catálogos actualizados
      console.log('📥 Descargando catálogos...');
      await this.downloadCatalogos();

      // 4. Propagar eliminaciones entre dispositivos (tombstones)
      // Endpoint ligero que descarga solo los local_id de inspecciones eliminadas
      console.log(
        '🗑️ Verificando inspecciones eliminadas en otros dispositivos...',
      );
      await this.syncDeletedInspecciones();

      // 5. Descargar inspecciones actualizadas del servidor
      // Se ejecuta DESPUÉS de subir y procesar tombstones para que el estado local
      // refleje los datos más recientes del servidor (incluye cambios de otros dispositivos)
      console.log('📥 Descargando inspecciones del servidor...');
      await this.downloadInspecciones();

      // 6. Actualizar contador de pendientes
      const pendingRegistros =
        await this.storageService.countPendingRegistros();
      const pendingInspecciones =
        await this.storageService.countPendingInspecciones();
      const pendingCount = pendingRegistros + pendingInspecciones;
      console.log(
        `✅ Sincronización completa - Registros pendientes: ${pendingRegistros}, Inspecciones pendientes: ${pendingInspecciones}`,
      );

      this.updateSyncStatus({
        syncing: false,
        lastSync: new Date(),
        pendingCount,
        error: null,
      });

      return {
        success: true,
        message: 'Sincronización completada exitosamente',
        local_id: '',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      // Intentar extraer más detalles si vienen en objeto
      let errorDetail: string | null = null;

      try {
        // Si el error tiene propiedades adicionales, serializarlas
        if (error && typeof error === 'object') {
          // Evitar ciclos
          errorDetail = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
          );
        }
      } catch (e) {
        errorDetail = String(errorMessage);
      }

      console.error('❌ Error en sincronización:', errorMessage, errorDetail);

      this.updateSyncStatus({
        syncing: false,
        error: errorMessage,
        error_detail: errorDetail,
      });

      return {
        success: false,
        message: errorMessage,
        local_id: '',
      };
    }
  }

  /**
   * Sincronizar registros pendientes con el servidor
   */
  async syncRegistros(): Promise<void> {
    const pendingRegistros = await this.storageService.getPendingRegistros();

    if (pendingRegistros.length === 0) {
      return;
    }

    try {
      const response = await this.apiService
        .syncRegistros(pendingRegistros)
        .toPromise();

      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Marcar registros exitosos como sincronizados
      if (
        response.data?.sincronizados &&
        response.data.sincronizados.length > 0
      ) {
        for (const exitoso of response.data.sincronizados) {
          await this.storageService.markRegistroAsSynced(
            exitoso.local_id,
            exitoso.server_id!,
          );
        }
      }

      // Manejar conflictos (registros rechazados por ser más antiguos)
      if (response.data?.errores && response.data.errores.length > 0) {
        const conflictos: SyncConflict[] = [];

        for (const error of response.data.errores) {
          if ((error as any).conflict) {
            console.warn(
              `⚠️ Conflicto detectado en registro ${error.local_id}:`,
              error.message,
            );

            const conflicto: SyncConflict = {
              local_id: error.local_id,
              server_id: (error as any).server_id,
              message:
                error.message || 'El registro en el servidor es más reciente',
              server_updated_at: (error as any).server_updated_at,
              client_updated_at: (error as any).client_updated_at,
            };

            conflictos.push(conflicto);

            // Descargar la versión del servidor para actualizar el registro local
            try {
              await this.downloadAndUpdateConflictedRegistro(error.local_id);
            } catch (downloadError) {
              console.error(
                'Error descargando registro en conflicto:',
                downloadError,
              );
            }
          }
        }

        // Emitir conflictos para que la UI los maneje
        if (conflictos.length > 0) {
          this.conflictsSubject.next(conflictos);
        }
      }
    } catch (error) {
      console.error('Error sincronizando registros:', error);
      throw error;
    }
  }

  /**
   * Descargar catálogos actualizados del servidor
   */
  async downloadCatalogos(): Promise<boolean> {
    try {
      const response = await this.apiService.getCatalogos().toPromise();

      if (!response || !response.data) {
        throw new Error('No se recibieron catálogos del servidor');
      }

      await this.storageService.saveCatalogos(response.data);
      return true;
    } catch (error) {
      console.error('Error descargando catálogos:', error);
      return false;
    }
  }

  /**
   * Sincronizar inspecciones pendientes con el servidor
   */
  async syncInspecciones(): Promise<void> {
    const pendingInspecciones =
      await this.storageService.getPendingInspecciones();

    if (pendingInspecciones.length === 0) {
      return;
    }

    // Procesar eliminaciones locales primero (soft-deleted)
    const eliminaciones = pendingInspecciones.filter((p) => p.deleted === true);
    if (eliminaciones.length > 0) {
      for (const delItem of eliminaciones) {
        try {
          // Pedir al servidor eliminar la inspección identificada por local_id
          await this.apiService.post('/sync/inspecciones/delete', {
            local_id: delItem.local_id,
          });

          // Borrar físicamente la inspección de IndexedDB
          const local = await this.databaseService.inspecciones
            .where('local_id')
            .equals(delItem.local_id)
            .first();
          if (local && local.id) {
            await this.databaseService.inspecciones.delete(local.id);
          }
        } catch (err) {
          console.warn(
            'No se pudo procesar eliminación en servidor, se intentará más tarde',
            delItem.local_id,
            err,
          );
          // Mantener marcada para reintento en la próxima sincronización
        }
      }
    }

    // Cargar relaciones para cada inspección pendiente
    const inspeccionesConRelaciones: InspeccionSync[] = await Promise.all(
      pendingInspecciones.map(async (inspeccion) => {
        // IMPORTANTE: Usar local_id para buscar relaciones en IndexedDB
        const areas = await this.databaseService.getInspeccionAreasByLocalId(
          inspeccion.local_id,
        );
        const inspectores =
          await this.databaseService.getInspeccionInspectoresByLocalId(
            inspeccion.local_id,
          );
        const resultados = await this.databaseService.getResultadosByLocalId(
          inspeccion.local_id,
        );

        // Transformar resultados para incluir visores y responsablesLevantamiento en formato correcto
        const resultadosTransformados = resultados.map((r) => ({
          ...r,
          // Transformar visores: Personal[] -> { personal_id }[]
          visores: (r.visores || []).map((v: any) => ({
            personal_id: v.personal_id ?? v.id,
          })),
          // Transformar responsablesLevantamiento: Personal[] -> { personal_id }[]
          responsablesLevantamiento: (r.responsablesLevantamiento || []).map(
            (rl: any) => ({
              personal_id: rl.personal_id ?? rl.id,
            }),
          ),
        }));

        return {
          ...inspeccion,
          // Transformar áreas al formato esperado por el backend: { area_id }
          areas: areas.map((a) => ({ area_id: a.area_id })),
          // Transformar inspectores al formato esperado: { personal_id, fecha_firma?, firma_digital? }
          inspectores: inspectores.map((i) => ({
            personal_id: i.personal_id,
            fecha_firma: i.fecha_firma,
            firma_digital: i.firma_digital,
          })),
          // Resultados con visores y responsables transformados
          resultados: resultadosTransformados,
        } as InspeccionSync;
      }),
    );

    // LOG para depuración de relaciones
    console.log(
      '📤 Inspecciones a sincronizar:',
      JSON.stringify(
        inspeccionesConRelaciones.map((i) => ({
          local_id: i.local_id,
          resultados: i.resultados?.map((r) => ({
            local_id: r.local_id,
            responsable_id: r.responsable_id,
            visores: r.visores,
            responsablesLevantamiento: r.responsablesLevantamiento,
          })),
        })),
        null,
        2,
      ),
    );

    try {
      const response = await this.apiService
        .syncInspecciones(inspeccionesConRelaciones)
        .toPromise();

      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Marcar inspecciones exitosas como sincronizadas
      if (
        response.data?.sincronizados &&
        response.data.sincronizados.length > 0
      ) {
        for (const exitoso of response.data.sincronizados) {
          await this.storageService.markInspeccionAsSynced(
            exitoso.local_id,
            exitoso.server_id!,
          );
        }
      }

      // Manejar conflictos (inspecciones rechazadas por ser más antiguas)
      if (response.data?.errores && response.data.errores.length > 0) {
        const conflictos: SyncConflict[] = [];

        for (const error of response.data.errores) {
          if ((error as any).conflict) {
            console.warn(
              `⚠️ Conflicto detectado en inspección ${error.local_id}:`,
              error.message,
            );

            const conflicto: SyncConflict = {
              local_id: error.local_id,
              server_id: (error as any).server_id,
              message:
                error.message || 'La inspección en el servidor es más reciente',
              server_updated_at: (error as any).server_updated_at,
              client_updated_at: (error as any).client_updated_at,
            };

            conflictos.push(conflicto);

            // Descargar la versión del servidor para actualizar la inspección local
            try {
              await this.downloadAndUpdateConflictedInspeccion(error.local_id);
            } catch (downloadError) {
              console.error(
                'Error descargando inspección en conflicto:',
                downloadError,
              );
            }
          }
        }

        // Emitir conflictos para que la UI los maneje
        if (conflictos.length > 0) {
          this.conflictsSubject.next(conflictos);
        }
      }
    } catch (error) {
      console.error('Error sincronizando inspecciones:', error);
      throw error;
    }
  }

  /**
   * Refrescar una inspección específica desde el servidor y actualizar IndexedDB.
   * Se usa al abrir el formulario de edición para asegurar datos frescos.
   * Retorna true si se actualizó exitosamente, false si no se pudo.
   */
  async refreshSingleInspeccion(localId: string): Promise<boolean> {
    try {
      const response: any = await this.apiService
        .getInspeccionByLocalId(localId)
        .toPromise();

      if (!response?.success || !response.data) {
        console.warn(
          `⚠️ No se pudo obtener inspección ${localId} del servidor`,
        );
        return false;
      }

      const serverInspeccion = response.data;
      console.log(
        `📥 Inspección ${localId} obtenida del servidor (updated_at: ${serverInspeccion.updated_at})`,
      );

      // Buscar la inspección local en IndexedDB
      const existente = await this.databaseService.inspecciones
        .where('local_id')
        .equals(localId)
        .first();

      // Separar el id del servidor para no sobreescribir el id auto-incremental de IndexedDB
      // pero guardarlo como server_id para mantener la referencia a la BD central
      const { id: serverId, ...serverDataWithoutId } = serverInspeccion;

      let inspeccionParaGuardar: any;

      if (existente) {
        // Preservar la clave primaria de IndexedDB
        inspeccionParaGuardar = {
          ...existente,
          ...serverDataWithoutId,
          id: existente.id,
          server_id: serverId, // ← Guardar el ID real de la BD central
          synced: true,
          synced_at: new Date().toISOString(),
        };
      } else {
        // Nueva inspección, dejar que IndexedDB auto-incremente
        inspeccionParaGuardar = {
          ...serverDataWithoutId,
          server_id: serverId, // ← Guardar el ID real de la BD central
          synced: true,
          synced_at: new Date().toISOString(),
        };
      }

      // Guardar/actualizar en IndexedDB
      await this.databaseService.inspecciones.put(inspeccionParaGuardar);

      // Actualizar relaciones (áreas, inspectores, resultados)
      await this.guardarRelacionesInspecciones([serverInspeccion]);

      console.log(
        `✅ Inspección ${localId} actualizada en IndexedDB desde el servidor`,
      );
      return true;
    } catch (error) {
      console.warn(
        `⚠️ No se pudo refrescar inspección ${localId} desde el servidor:`,
        error,
      );
      return false;
    }
  }

  /**
   * Descargar inspecciones del servidor
   */
  async downloadInspecciones(): Promise<void> {
    try {
      const response = await this.apiService.downloadInspecciones().toPromise();
      if (response && response.data) {
        const inspecciones = response.data;
        console.log(
          `📥 Descargando ${inspecciones.length} inspecciones del servidor...`,
        );

        // LOG: Verificar que numero_registro viene del servidor
        inspecciones.forEach((insp: any, index: number) => {
          console.log(`Inspección ${index}:`, {
            local_id: insp.local_id,
            numero_registro: insp.numero_registro,
            fecha_hora_inspeccion: insp.fecha_hora_inspeccion,
            id: insp.id,
          });
        });

        // Obtener inspecciones locales para preservar claves primarias de IndexedDB
        const inspeccionesLocales =
          await this.storageService.getAllInspecciones();

        // Limpiar duplicados por local_id (mantener el más reciente)
        const localIdsVistos = new Set<string>();
        const duplicados: number[] = [];

        for (const inspeccion of inspeccionesLocales) {
          if (localIdsVistos.has(inspeccion.local_id)) {
            // Es un duplicado, marcarlo para eliminar
            if (inspeccion.id) {
              duplicados.push(inspeccion.id);
            }
          } else {
            localIdsVistos.add(inspeccion.local_id);
          }
        }

        // Eliminar duplicados de IndexedDB
        if (duplicados.length > 0) {
          console.warn(
            `🗑️ Eliminando ${duplicados.length} inspecciones duplicadas...`,
          );
          await this.databaseService.inspecciones.bulkDelete(duplicados);
        }

        // Mapear inspecciones del servidor con los datos locales
        const inspeccionesParaGuardar = inspecciones.map((i: any) => {
          // Buscar si ya existe localmente por local_id
          const existente = inspeccionesLocales.find(
            (local: any) => local.local_id === i.local_id,
          );

          // Separar el id del servidor para no sobreescribir el id auto-incremental de IndexedDB
          // pero guardarlo como server_id para mantener la referencia a la BD central
          const { id: serverId, ...serverDataWithoutId } = i;

          if (existente) {
            // PRESERVAR la clave primaria de IndexedDB (existente.id)
            // y sobrescribir el resto con los datos del servidor
            return {
              ...existente,
              ...serverDataWithoutId,
              id: existente.id, // ← Forzar el id de IndexedDB (no el del servidor)
              server_id: serverId, // ← Guardar el ID real de la BD central
              synced: true,
              synced_at: new Date().toISOString(),
            };
          }

          // Si es nuevo, crear SIN id para que IndexedDB auto-incremente
          return {
            ...serverDataWithoutId,
            server_id: serverId, // ← Guardar el ID real de la BD central
            synced: true,
            synced_at: new Date().toISOString(),
          };
        });

        console.log(
          '🔍 Datos a guardar en IndexedDB:',
          inspeccionesParaGuardar,
        );

        // Guardar en IndexedDB (bulkPut actualiza si existe)
        await this.storageService.saveInspecciones(inspeccionesParaGuardar);
        console.log(
          `✅ ${inspecciones.length} inspecciones guardadas/actualizadas en IndexedDB`,
        );

        // Guardar las relaciones en sus tablas separadas
        await this.guardarRelacionesInspecciones(inspecciones);
      }

      // ── Procesar tombstones (inspecciones eliminadas en el servidor) ──
      const deletedList = (response as any)?.deleted;
      if (deletedList && Array.isArray(deletedList) && deletedList.length > 0) {
        await this.processDeletedTombstones(deletedList);
      }
    } catch (error) {
      console.error('Error descargando inspecciones:', error);
      throw error;
    }
  }

  /**
   * Procesar tombstones: eliminar inspecciones locales que fueron borradas en el servidor.
   * Evita que dispositivos que no estaban online al momento del delete sigan mostrando
   * inspecciones que ya no existen.
   */
  private async processDeletedTombstones(
    tombstones: { local_id: string; deleted_at: string }[],
  ): Promise<void> {
    console.log(
      `🗑️ Procesando ${tombstones.length} tombstones de eliminación...`,
    );

    for (const tombstone of tombstones) {
      try {
        const localRecord = await this.databaseService.inspecciones
          .where('local_id')
          .equals(tombstone.local_id)
          .first();

        if (localRecord && localRecord.id) {
          // Limpiar relaciones antes de eliminar la inspección
          await this.databaseService.inspeccion_areas
            .where('inspeccion_id')
            .equals(localRecord.id)
            .delete();
          await this.databaseService.inspeccion_inspectores
            .where('inspeccion_id')
            .equals(localRecord.id)
            .delete();
          await this.databaseService.resultados_inspeccion
            .where('inspeccion_id')
            .equals(localRecord.id)
            .delete();

          // Eliminar la inspección
          await this.databaseService.inspecciones.delete(localRecord.id);
          console.log(
            `🗑️ Inspección ${tombstone.local_id} eliminada localmente (tombstone)`,
          );
        }
      } catch (err) {
        console.warn(`Error procesando tombstone ${tombstone.local_id}:`, err);
      }
    }
  }

  /**
   * Sincronizar inspecciones eliminadas (tombstones) con el servidor.
   * Endpoint ligero que se llama en cada ciclo de auto-sync para propagar
   * eliminaciones entre dispositivos sin necesidad de descargar todos los datos.
   */
  async syncDeletedInspecciones(): Promise<void> {
    try {
      const lastSync = localStorage.getItem('last_sync');
      const params = lastSync ? `?since=${lastSync}` : '';
      const response: any = await this.apiService.get(
        `/sync/inspecciones/deleted${params}`,
      );

      if (response?.success && response.data?.length > 0) {
        await this.processDeletedTombstones(response.data);
      }
    } catch (error) {
      // No fatal: si falla no interrumpe el resto del sync
      console.warn('Error descargando tombstones de inspecciones:', error);
    }
  }

  /**
   * Guardar relaciones de inspecciones (áreas, inspectores, resultados) en IndexedDB
   * Usa local_id como clave primaria para garantizar unicidad (similar a sync() de Laravel)
   * bulkPut hará upsert automáticamente: inserta si no existe, actualiza si existe
   */
  private async guardarRelacionesInspecciones(
    inspecciones: any[],
  ): Promise<void> {
    const todasAreas: any[] = [];
    const todosInspectores: any[] = [];
    const todosResultados: any[] = [];

    for (const inspeccion of inspecciones) {
      // IMPORTANTE: Buscar la inspección en IndexedDB por local_id para obtener su ID de IndexedDB
      // Esto es necesario porque el inspeccion.id que viene del servidor es diferente al ID autoincremental de IndexedDB
      const inspeccionEnIndexedDB = await this.databaseService.inspecciones
        .where('local_id')
        .equals(inspeccion.local_id)
        .first();

      if (!inspeccionEnIndexedDB || !inspeccionEnIndexedDB.id) {
        console.warn(
          `⚠️ Inspección con local_id ${inspeccion.local_id} no encontrada en IndexedDB, saltando relaciones`,
        );
        continue;
      }

      // Usar el ID de IndexedDB (autoincremental), NO el ID del servidor
      const inspeccionIdIndexedDB = inspeccionEnIndexedDB.id;
      const inspeccionServerId = inspeccion.id;

      // Primero, limpiar relaciones existentes para evitar duplicados
      // Esto es especialmente importante al re-sincronizar
      await this.databaseService.inspeccion_areas
        .where('inspeccion_id')
        .equals(inspeccionIdIndexedDB)
        .delete();

      await this.databaseService.inspeccion_inspectores
        .where('inspeccion_id')
        .equals(inspeccionIdIndexedDB)
        .delete();

      await this.databaseService.resultados_inspeccion
        .where('inspeccion_id')
        .equals(inspeccionIdIndexedDB)
        .delete();

      // Guardar áreas de la inspección
      // local_id = "inspeccion_id-area_id" garantiza unicidad de la relación
      if (inspeccion.areas && Array.isArray(inspeccion.areas)) {
        for (const area of inspeccion.areas) {
          todasAreas.push({
            local_id: `insp-${inspeccionServerId}-area-${area.id}`,
            inspeccion_id: inspeccionIdIndexedDB, // ← Usar ID de IndexedDB
            area_id: area.id,
            synced: true,
          });
        }
      }

      // Guardar inspectores de la inspección
      // local_id = "inspeccion_id-personal_id" garantiza unicidad
      if (inspeccion.inspectores && Array.isArray(inspeccion.inspectores)) {
        for (const inspector of inspeccion.inspectores) {
          todosInspectores.push({
            local_id: `insp-${inspeccionServerId}-inspector-${inspector.id}`,
            inspeccion_id: inspeccionIdIndexedDB, // ← Usar ID de IndexedDB
            personal_id: inspector.id,
            fecha_firma: inspector.pivot?.fecha_firma,
            firma_digital: inspector.pivot?.firma_digital,
            synced: true,
          });
        }
      }

      // Guardar resultados de la inspección
      // Los resultados ya tienen su propio local_id del servidor
      if (inspeccion.resultados && Array.isArray(inspeccion.resultados)) {
        for (const resultado of inspeccion.resultados) {
          // Asegurar que tenga un local_id único
          const resultadoLocalId =
            resultado.local_id || `resultado-${resultado.id}`;

          // Normalizar snake_case a camelCase para compatibilidad
          const responsablesLev =
            resultado.responsables_levantamiento ||
            resultado.responsablesLevantamiento ||
            [];
          const visoresList = resultado.visores || [];
          const fotoFinalAprobador =
            resultado.foto_final_aprobador ||
            resultado.fotoFinalAprobador ||
            null;

          // Normalizar fechas (quitar microsegundos extras)
          const normalizarFecha = (fecha: string | null): string | null => {
            if (!fecha) return null;
            return fecha.replace(/(\.[0-9]{3})[0-9]*Z$/, '$1Z');
          };

          todosResultados.push({
            ...resultado,
            local_id: resultadoLocalId,
            inspeccion_id: inspeccionIdIndexedDB,
            // Normalizar campos a camelCase
            responsablesLevantamiento: responsablesLev,
            visores: visoresList,
            fotoFinalAprobador: fotoFinalAprobador,
            // Normalizar fechas
            fecha_cierre: normalizarFecha(resultado.fecha_cierre),
            foto_final_aprobada_at: normalizarFecha(
              resultado.foto_final_aprobada_at,
            ),
            foto_inicial_aprobada_at: normalizarFecha(
              resultado.foto_inicial_aprobada_at,
            ),
            synced: true,
          });
        }
      }
    }

    // Guardar todas las relaciones en IndexedDB
    // bulkPut con local_id como clave primaria = upsert automático (no hay duplicados)
    if (todasAreas.length > 0) {
      await this.databaseService.saveInspeccionAreas(todasAreas);
      console.log(`📥 ${todasAreas.length} áreas de inspección sincronizadas`);
    }

    if (todosInspectores.length > 0) {
      await this.databaseService.saveInspeccionInspectores(todosInspectores);
      console.log(`📥 ${todosInspectores.length} inspectores sincronizados`);
    }

    if (todosResultados.length > 0) {
      await this.databaseService.saveResultadosInspeccion(todosResultados);
      console.log(`📥 ${todosResultados.length} resultados sincronizados`);
    }
  }

  /**
   * Descargar registros del servidor
   */
  async downloadRegistros(): Promise<void> {
    try {
      const response = await this.apiService.getRegistros().toPromise();
      if (response && response.data) {
        const registros = response.data;
        console.log(
          `📥 Descargando ${registros.length} registros del servidor...`,
        );

        // Obtener registros locales para preservar claves primarias de IndexedDB
        const registrosLocales = await this.storageService.getAllRegistros();

        // Mapear registros del servidor con los datos locales
        const registrosParaGuardar = registros.map((r: any) => {
          // Buscar si ya existe localmente por local_id
          const existente = registrosLocales.find(
            (local: any) => local.local_id === r.local_id,
          );

          // Separar el id del servidor para no sobreescribir el id de IndexedDB
          const { id: _serverId, ...serverDataWithoutId } = r;

          if (existente) {
            return {
              ...existente,
              ...serverDataWithoutId,
              id: existente.id, // ← Preservar clave primaria de IndexedDB
              synced: true,
              synced_at: new Date().toISOString(),
            };
          }

          // Nuevo registro: sin id para que IndexedDB auto-incremente
          return {
            ...serverDataWithoutId,
            synced: true,
            synced_at: new Date().toISOString(),
          };
        });

        // Guardar en IndexedDB (bulkPut actualiza si existe)
        await this.storageService.saveRegistros(registrosParaGuardar);
        console.log(
          `✅ ${registros.length} registros guardados/actualizados en IndexedDB`,
        );
      }
    } catch (error) {
      console.error('Error descargando registros:', error);
      throw error;
    }
  }

  /**
   * Sincronizar una inspección específica desde el servidor a IndexedDB
   * Útil después de hacer cambios en el servidor (subir fotos, validar, etc.)
   */
  async syncInspeccionFromServer(inspeccionServerId: number): Promise<void> {
    try {
      console.log(
        `🔄 Sincronizando inspección #${inspeccionServerId} desde el servidor...`,
      );

      // Obtener la inspección del servidor
      const response: any = await this.apiService.get(
        `/inspecciones/${inspeccionServerId}`,
      );

      if (!response || !response.success || !response.data) {
        console.warn(
          `⚠️ No se pudo obtener la inspección #${inspeccionServerId} del servidor`,
        );
        return;
      }

      const inspeccionServidor = response.data;

      // Buscar la inspección en IndexedDB por local_id
      const inspeccionLocal = await this.databaseService.inspecciones
        .where('local_id')
        .equals(inspeccionServidor.local_id)
        .first();

      if (!inspeccionLocal || !inspeccionLocal.id) {
        console.warn(
          `⚠️ Inspección con local_id ${inspeccionServidor.local_id} no encontrada en IndexedDB`,
        );
        return;
      }

      const inspeccionIdIndexedDB = inspeccionLocal.id;

      // Actualizar la inspección principal
      await this.databaseService.inspecciones.update(inspeccionIdIndexedDB, {
        ...inspeccionServidor,
        id: inspeccionIdIndexedDB, // Preservar el ID de IndexedDB
        synced: true,
        synced_at: new Date().toISOString(),
      });

      // Actualizar los resultados
      if (
        inspeccionServidor.resultados &&
        Array.isArray(inspeccionServidor.resultados)
      ) {
        // Limpiar resultados existentes
        await this.databaseService.resultados_inspeccion
          .where('inspeccion_id')
          .equals(inspeccionIdIndexedDB)
          .delete();

        // Normalizar fechas (quitar microsegundos extras)
        const normalizarFecha = (fecha: string | null): string | null => {
          if (!fecha) return null;
          return fecha.replace(/(\.[0-9]{3})[0-9]*Z$/, '$1Z');
        };

        // Guardar los nuevos resultados con datos normalizados
        const resultadosParaGuardar = inspeccionServidor.resultados.map(
          (resultado: any) => {
            // Normalizar snake_case a camelCase
            const responsablesLev =
              resultado.responsables_levantamiento ||
              resultado.responsablesLevantamiento ||
              [];
            const visoresList = resultado.visores || [];
            const fotoFinalAprobador =
              resultado.foto_final_aprobador ||
              resultado.fotoFinalAprobador ||
              null;

            return {
              ...resultado,
              local_id: resultado.local_id || `resultado-${resultado.id}`,
              inspeccion_id: inspeccionIdIndexedDB,
              // Normalizar campos a camelCase
              responsablesLevantamiento: responsablesLev,
              visores: visoresList,
              fotoFinalAprobador: fotoFinalAprobador,
              // Normalizar fechas
              fecha_cierre: normalizarFecha(resultado.fecha_cierre),
              foto_final_aprobada_at: normalizarFecha(
                resultado.foto_final_aprobada_at,
              ),
              foto_inicial_aprobada_at: normalizarFecha(
                resultado.foto_inicial_aprobada_at,
              ),
              synced: true,
            };
          },
        );

        if (resultadosParaGuardar.length > 0) {
          await this.databaseService.saveResultadosInspeccion(
            resultadosParaGuardar,
          );
        }
      }

      console.log(
        `✅ Inspección #${inspeccionServerId} sincronizada a IndexedDB`,
      );
    } catch (error) {
      console.error(
        `Error sincronizando inspección #${inspeccionServerId}:`,
        error,
      );
      // No lanzamos el error para que no interrumpa el flujo principal
    }
  }

  /**
   * Obtener estado local de sincronización
   */
  async getLocalStatus(): Promise<{
    total: number;
    sincronizados: number;
    pendientes: number;
  }> {
    const total = await this.storageService.countInspecciones();
    const pendientes = await this.storageService.countPendingInspecciones();
    const sincronizados = total - pendientes;

    return {
      total,
      sincronizados,
      pendientes,
    };
  }

  /**
   * Guardar registro localmente (offline)
   */
  async saveRegistroOffline(registro: Registro): Promise<void> {
    // Guardar en IndexedDB
    await this.storageService.saveRegistro(registro);

    // Actualizar contador de pendientes
    const pendingCount = await this.storageService.countPendingRegistros();
    this.updateSyncStatus({ pendingCount });

    // Si estamos online, intentar sincronizar inmediatamente
    if (this.isOnline && this.authService.isAuthenticated) {
      setTimeout(() => this.syncAll(), 1000);
    }
  }

  /**
   * Obtener contador de registros pendientes
   */
  async getPendingCount(): Promise<number> {
    return await this.storageService.countPendingRegistros();
  }

  /**
   * Forzar sincronización manual
   */
  async forceSyncNow(): Promise<SyncResult> {
    return await this.syncAll();
  }

  /**
   * Verificar si necesita sincronizar
   */
  needsSync(): boolean {
    const status = this.syncStatusSubject.value;

    // Necesita sincronizar si:
    // 1. Hay registros pendientes
    if (status.pendingCount && status.pendingCount > 0) {
      return true;
    }

    // 2. Nunca se ha sincronizado
    if (!status.lastSync) {
      return true;
    }

    // 3. Han pasado más de 5 minutos desde la última sincronización
    const fiveMinutesAgo = new Date(Date.now() - this.autoSyncInterval);
    if (status.lastSync < fiveMinutesAgo) {
      return true;
    }

    return false;
  }

  /**
   * Limpiar datos y estado de sincronización
   */
  async clearSyncData(): Promise<void> {
    await this.storageService.clearAll();
    localStorage.removeItem('last_sync');
    this.updateSyncStatus({
      lastSync: null,
      pendingCount: 0,
      error: null,
    });
  }

  /**
   * Descargar y actualizar un registro que tuvo conflicto
   */
  private async downloadAndUpdateConflictedRegistro(
    localId: string,
  ): Promise<void> {
    try {
      // Obtener el registro local para tener el server_id
      const registroLocal =
        await this.storageService.getRegistroByLocalId(localId);

      if (!registroLocal || !registroLocal.id) {
        console.error('No se pudo encontrar el registro local con conflicto');
        return;
      }

      // Descargar todos los registros y actualizar
      // (Una optimización sería tener un endpoint para obtener un solo registro)
      await this.downloadRegistros();

      console.log(
        `✅ Registro ${localId} actualizado con la versión del servidor`,
      );
    } catch (error) {
      console.error('Error actualizando registro con conflicto:', error);
      throw error;
    }
  }

  /**
   * Descargar y actualizar una inspección que tuvo conflicto
   */
  private async downloadAndUpdateConflictedInspeccion(
    localId: string,
  ): Promise<void> {
    try {
      // Obtener la inspección local para tener el server_id
      const inspeccionLocal =
        await this.storageService.getInspeccionByLocalId(localId);

      if (!inspeccionLocal || !inspeccionLocal.id) {
        console.error('No se pudo encontrar la inspección local con conflicto');
        return;
      }

      // Descargar todas las inspecciones y actualizar
      // (Una optimización sería tener un endpoint para obtener una sola inspección)
      await this.downloadInspecciones();

      console.log(
        `✅ Inspección ${localId} actualizada con la versión del servidor`,
      );
    } catch (error) {
      console.error('Error actualizando inspección con conflicto:', error);
      throw error;
    }
  }
}
