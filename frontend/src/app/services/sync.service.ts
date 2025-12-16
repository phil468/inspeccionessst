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
import { AuthService } from './auth.service';
import { Registro, NetworkStatus, SyncStatus, SyncResult } from '../models';
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
    private authService: AuthService
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
            `❌ No sincroniza - Online: ${this.isOnline}, Auth: ${this.authService.isAuthenticated}`
          );
        }
      }
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
      // 1. Sincronizar registros pendientes
      console.log('📤 Sincronizando registros pendientes...');
      await this.syncRegistros();

      // 2. Descargar catálogos actualizados
      console.log('📥 Descargando catálogos...');
      await this.downloadCatalogos();

      // 3. Actualizar contador de pendientes
      const pendingCount = await this.storageService.countPendingRegistros();
      console.log(`✅ Sincronización completa - Pendientes: ${pendingCount}`);

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

      console.error('❌ Error en sincronización:', errorMessage);

      this.updateSyncStatus({
        syncing: false,
        error: errorMessage,
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
            exitoso.server_id!
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
              error.message
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
                downloadError
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
   * Descargar registros del servidor
   */
  async downloadRegistros(): Promise<void> {
    try {
      const response = await this.apiService.getRegistros().toPromise();
      if (response && response.data) {
        const registros = response.data;
        console.log(
          `📥 Descargando ${registros.length} registros del servidor...`
        );

        // Obtener registros locales para preservar claves primarias de IndexedDB
        const registrosLocales = await this.storageService.getAllRegistros();

        // Mapear registros del servidor con los datos locales
        const registrosParaGuardar = registros.map((r: any) => {
          // Buscar si ya existe localmente por local_id o id del servidor
          const existente = registrosLocales.find(
            (local: any) => local.local_id === r.local_id || local.id === r.id
          );

          // Si existe, preservar su clave primaria de IndexedDB
          return {
            ...r,
            synced: true,
            synced_at: new Date().toISOString(),
          };
        });

        // Guardar en IndexedDB (bulkPut actualiza si existe)
        await this.storageService.saveRegistros(registrosParaGuardar);
        console.log(
          `✅ ${registros.length} registros guardados/actualizados en IndexedDB`
        );
      }
    } catch (error) {
      console.error('Error descargando registros:', error);
      throw error;
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
    const total = await this.storageService.countRegistros();
    const pendientes = await this.storageService.countPendingRegistros();
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
    localId: string
  ): Promise<void> {
    try {
      // Obtener el registro local para tener el server_id
      const registroLocal = await this.storageService.getRegistroByLocalId(
        localId
      );

      if (!registroLocal || !registroLocal.id) {
        console.error('No se pudo encontrar el registro local con conflicto');
        return;
      }

      // Descargar todos los registros y actualizar
      // (Una optimización sería tener un endpoint para obtener un solo registro)
      await this.downloadRegistros();

      console.log(
        `✅ Registro ${localId} actualizado con la versión del servidor`
      );
    } catch (error) {
      console.error('Error actualizando registro con conflicto:', error);
      throw error;
    }
  }
}
