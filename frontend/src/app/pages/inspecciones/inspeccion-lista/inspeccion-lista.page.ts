import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonicModule,
  ToastController,
  LoadingController,
  AlertController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../../services/database.service';
import { SyncService } from '../../../services/sync.service';
import { NetworkService } from '../../../services/network.service';
import { InspeccionService } from '../../../services/inspeccion.service';
import { FormsModule } from '@angular/forms';
import { Inspeccion } from '../../../models/inspeccion.model';
import { addIcons } from 'ionicons';
import {
  addOutline,
  syncOutline,
  searchOutline,
  cloudDoneOutline,
  cloudUploadOutline,
  cloudDownloadOutline,
  createOutline,
  calendarOutline,
  businessOutline,
  notificationsOutline,
  trashOutline,
  statsChartOutline,
  wifiOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-inspeccion-lista',
  templateUrl: './inspeccion-lista.page.html',
  styleUrls: ['./inspeccion-lista.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InspeccionListaPage implements OnInit {
  inspecciones: Inspeccion[] = [];
  inspeccionesFiltradas: Inspeccion[] = [];
  searchTerm = '';
  isOnline = false;
  syncStatus = {
    total: 0,
    sincronizados: 0,
    pendientes: 0,
  };
  private syncSubscription?: Subscription;

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private syncService: SyncService,
    private networkService: NetworkService,
    private inspeccionService: InspeccionService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {
    addIcons({
      addOutline,
      syncOutline,
      searchOutline,
      cloudDoneOutline,
      cloudUploadOutline,
      cloudDownloadOutline,
      createOutline,
      calendarOutline,
      businessOutline,
      notificationsOutline,
      trashOutline,
      statsChartOutline,
      wifiOutline,
      cloudOfflineOutline,
    });
  }

  async ngOnInit() {
    await this.loadInspecciones();
    await this.loadSyncStatus();
    this.checkConnectivity();

    this.syncSubscription = this.syncService.syncStatus$.subscribe(
      async (status: any) => {
        if (status.lastSync) {
          await this.loadInspecciones();
          await this.loadSyncStatus();
        }
      }
    );
  }

  async ionViewWillEnter() {
    await this.loadInspecciones();
    await this.loadSyncStatus();
  }

  ngOnDestroy() {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  async loadInspecciones() {
    try {
      this.inspecciones = await this.databaseService.getInspecciones();

      // Enriquecer con nombres de catálogos
      const empresas = await this.databaseService.getEmpresas();
      const areas = await this.databaseService.getAreas();

      this.inspecciones = this.inspecciones.map((inspeccion) => {
        const empresa = empresas.find(
          (e: any) => e.id === inspeccion.empresa_id
        );
        const area = areas.find((a: any) => a.id === inspeccion.area_id);

        return {
          ...inspeccion,
          empresa,
          area,
        };
      });

      // Ordenar por más reciente
      this.inspecciones.sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });

      this.inspeccionesFiltradas = [...this.inspecciones];
    } catch (error) {
      console.error('Error al cargar inspecciones:', error);
      await this.showToast('Error al cargar inspecciones', 'danger');
    }
  }

  async loadSyncStatus() {
    this.syncStatus.total = await this.databaseService.inspecciones.count();
    this.syncStatus.pendientes = await this.databaseService.inspecciones
      .filter((i: any) => !i.synced)
      .count();
    this.syncStatus.sincronizados =
      this.syncStatus.total - this.syncStatus.pendientes;
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  filterInspecciones() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.inspeccionesFiltradas = [...this.inspecciones];
      return;
    }

    this.inspeccionesFiltradas = this.inspecciones.filter(
      (inspeccion) =>
        inspeccion.empresa?.name.toLowerCase().includes(term) ||
        inspeccion.area?.name.toLowerCase().includes(term) ||
        inspeccion.zona_inspeccionada?.toLowerCase().includes(term) ||
        inspeccion.numero_registro?.toLowerCase().includes(term) ||
        inspeccion.tipo_inspeccion.toLowerCase().includes(term)
    );
  }

  async nuevaInspeccion() {
    this.router.navigate(['/inspecciones/form']);
  }

  async editarInspeccion(inspeccion: Inspeccion) {
    const id = inspeccion.id || inspeccion.local_id;
    this.router.navigate(['/inspecciones/form', id]);
  }

  async sincronizar() {
    if (!this.isOnline) {
      await this.showToast('Debes estar conectado para sincronizar', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Sincronizando...',
    });
    await loading.present();

    try {
      // 1. Subir inspecciones pendientes
      await this.syncService.syncInspecciones();

      // 2. Descargar últimas 100 inspecciones del servidor
      await this.syncService.downloadInspecciones();

      await this.showToast('Sincronización completa', 'success');
      await this.loadInspecciones();
      await this.loadSyncStatus();
    } catch (error: any) {
      console.error('Error al sincronizar:', error);

      // Mostrar mensaje amigable según el tipo de error
      let mensajeUsuario = 'No se pudo completar la sincronización';

      if (!navigator.onLine) {
        mensajeUsuario = 'Sin conexión a internet';
      } else if (
        error.message?.includes('timeout') ||
        error.message?.includes('Timeout')
      ) {
        mensajeUsuario = 'La conexión tardó demasiado. Intenta nuevamente';
      } else if (
        error.message?.includes('Network') ||
        error.message?.includes('Failed to fetch')
      ) {
        mensajeUsuario = 'Error de conexión con el servidor';
      } else if (
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized')
      ) {
        mensajeUsuario = 'Sesión expirada. Por favor inicia sesión nuevamente';
      } else if (
        error.message?.includes('500') ||
        error.message?.includes('Server')
      ) {
        mensajeUsuario = 'Error en el servidor. Intenta más tarde';
      }

      await this.showToast(mensajeUsuario, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  getEstadoChip(inspeccion: Inspeccion): { color: string; text: string } {
    if (inspeccion.synced) {
      return { color: 'success', text: 'Sincronizado' };
    }
    return { color: 'warning', text: 'Pendiente' };
  }

  formatDate(date?: string): string {
    if (!date) return 'Sin fecha';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  formatDateTime(datetime?: string): string {
    if (!datetime) return 'Sin fecha';
    const d = new Date(datetime);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async enviarNotificaciones(inspeccion: Inspeccion) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para enviar notificaciones',
        'warning'
      );
      return;
    }

    if (!inspeccion.synced) {
      await this.showToast(
        'La inspección debe estar sincronizada antes de enviar notificaciones',
        'warning'
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Enviar Notificaciones',
      message:
        '¿Deseas enviar notificaciones por correo a todo el personal asignado en esta inspección?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar',
          handler: async () => {
            // Ejecutar en segundo plano sin bloquear el cierre del alert
            await this.enviarNotificacionesConfirmado(inspeccion);
            return true; // Cierra el alert inmediatamente
          },
        },
      ],
    });

    await alert.present();
  }

  private async enviarNotificacionesConfirmado(inspeccion: Inspeccion) {
    console.log('Enviando notificaciones para inspección ID:', inspeccion.id);

    // Toast inicial con duración larga para que el usuario sepa que está procesando
    await this.showToast('Enviando notificaciones...', 'primary', 5000);

    try {
      const response: any = await this.inspeccionService.enviarNotificaciones(
        inspeccion.id!
      );

      if (response.success) {
        await this.showToast(
          response.message || 'Notificaciones enviadas con éxito',
          'success'
        );
      } else {
        await this.showToast('Error al enviar notificaciones', 'danger');
      }
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      await this.showToast('Error al enviar notificaciones', 'danger');
    }
  }

  async eliminarInspeccion(inspeccion: Inspeccion) {
    const alert = await this.alertController.create({
      header: 'Eliminar Inspección',
      message: '¿Estás seguro que deseas eliminar esta inspección?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.eliminarInspeccionConfirmado(inspeccion);
          },
        },
      ],
    });

    await alert.present();
  }

  private async eliminarInspeccionConfirmado(inspeccion: Inspeccion) {
    try {
      if (inspeccion.id) {
        await this.databaseService.inspecciones.delete(inspeccion.id);
        await this.loadInspecciones();
        await this.loadSyncStatus();
        await this.showToast('Inspección eliminada', 'success');
      }
    } catch (error) {
      console.error('Error al eliminar inspección:', error);
      await this.showToast('Error al eliminar inspección', 'danger');
    }
  }

  private async showToast(
    message: string,
    color: string = 'dark',
    duration: number = 3000
  ) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
