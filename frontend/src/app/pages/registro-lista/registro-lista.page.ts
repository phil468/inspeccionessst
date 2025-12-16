import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonicModule,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { NetworkService } from '../../services/network.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  syncOutline,
  wifiOutline,
  statsChartOutline,
  cloudDoneOutline,
  cloudUploadOutline,
  documentTextOutline,
  addOutline,
  add,
  createOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-registro-lista',
  templateUrl: './registro-lista.page.html',
  styleUrls: ['./registro-lista.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class RegistroListaPage implements OnInit, OnDestroy {
  registros: any[] = [];
  registrosFiltrados: any[] = [];
  registrosAgrupados: any[] = [];
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
    private authService: AuthService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      arrowBackOutline,
      syncOutline,
      wifiOutline,
      statsChartOutline,
      cloudDoneOutline,
      cloudUploadOutline,
      documentTextOutline,
      addOutline,
      add,
      createOutline,
    });
  }

  async ngOnInit() {
    await this.loadRegistros();
    await this.loadSyncStatus();
    this.checkConnectivity();

    // Suscribirse a cambios de sincronización para actualizar la lista automáticamente
    this.syncSubscription = this.syncService.syncStatus$.subscribe(
      async (status) => {
        if (status.lastSync) {
          // La sincronización se completó, recargar la lista
          await this.loadRegistros();
          await this.loadSyncStatus();
        }
      }
    );
  }

  async ionViewWillEnter() {
    await this.loadRegistros();
    await this.loadSyncStatus();
  }

  async loadRegistros() {
    try {
      this.registros = await this.databaseService.getRegistros();

      // Enriquecer registros con nombres de catálogos
      const materiales = await this.databaseService.getMateriales();
      const campanias = await this.databaseService.getCampanias();
      const fundos = await this.databaseService.getFundos();
      const lotes = await this.databaseService.getLotes();
      const motivos = await this.databaseService.getMotivos();

      this.registros = this.registros.map((registro: any) => ({
        ...registro,
        material: materiales.find((m: any) => m.id === registro.material_id),
        campania: campanias.find((c: any) => c.id === registro.campania_id),
        fundo: fundos.find((f: any) => f.id === registro.fundo_id),
        lote: lotes.find((l: any) => l.id === registro.lote_id),
        motivo: motivos.find((m: any) => m.id === registro.motivo_id),
      }));

      this.registrosFiltrados = this.registros;
      this.agruparPorFecha();
    } catch (error) {
      console.error('Error al cargar registros:', error);
      this.showToast('Error al cargar registros', 'danger');
    }
  }

  async loadSyncStatus() {
    try {
      this.syncStatus = await this.syncService.getLocalStatus();
    } catch (error) {
      console.error('Error al cargar estado de sincronización:', error);
    }
  }

  checkConnectivity() {
    // Suscribirse a cambios de red
    this.networkService.isOnline$.subscribe((status) => {
      this.isOnline = status;
      console.log('Estado de red en RegistroLista:', status);
    });
  }

  agruparPorFecha() {
    const grupos: any = {};

    this.registrosFiltrados.forEach((registro) => {
      const fecha = new Date(registro.fecha_registro).toLocaleDateString(
        'es-ES',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }
      );

      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }

      grupos[fecha].push(registro);
    });

    this.registrosAgrupados = Object.keys(grupos).map((fecha) => ({
      fecha,
      registros: grupos[fecha],
    }));

    // Ordenar por fecha descendente
    this.registrosAgrupados.sort((a, b) => {
      return (
        new Date(b.registros[0].fecha_registro).getTime() -
        new Date(a.registros[0].fecha_registro).getTime()
      );
    });
  }

  filterRegistros(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';

    if (!this.searchTerm) {
      this.registrosFiltrados = this.registros;
    } else {
      this.registrosFiltrados = this.registros.filter((registro: any) => {
        return (
          registro.numero_tractor?.toLowerCase().includes(this.searchTerm) ||
          registro.observaciones?.toLowerCase().includes(this.searchTerm) ||
          registro.cantidad?.toString().includes(this.searchTerm) ||
          registro.material?.nombre?.toLowerCase().includes(this.searchTerm) ||
          registro.material?.codigo?.toLowerCase().includes(this.searchTerm)
        );
      });
    }

    this.agruparPorFecha();
  }

  async handleRefresh(event: any) {
    if (this.isOnline) {
      try {
        await this.syncService.syncRegistros();
        await this.syncService.downloadRegistros();
        await this.loadRegistros();
        await this.loadSyncStatus();
        this.showToast('Sincronización completada', 'success');
      } catch (error) {
        console.error('Error al sincronizar:', error);
        this.showToast('Error al sincronizar', 'danger');
      }
    } else {
      await this.loadRegistros();
      await this.loadSyncStatus();
      this.showToast('Sin conexión - mostrando datos locales', 'warning');
    }

    event.target.complete();
  }

  async syncAll() {
    if (!this.isOnline) {
      this.showToast('No hay conexión a internet', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Sincronizando...',
    });
    await loading.present();

    try {
      await this.syncService.syncRegistros();
      await this.syncService.downloadRegistros();
      await this.loadRegistros();
      await this.loadSyncStatus();
      this.showToast('Sincronización completada', 'success');
    } catch (error) {
      console.error('Error al sincronizar:', error);
      this.showToast('Error al sincronizar', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  verDetalle(registro: any) {
    // TODO: Navegar a página de detalle
    console.log('Ver detalle:', registro);
  }

  editarRegistro(registro: any, event: Event) {
    // Prevenir que se dispare el click del card
    event.stopPropagation();

    if (!this.canEdit()) {
      this.showToast('No tienes permisos para editar registros', 'warning');
      return;
    }

    // Navegar al formulario de edición usando local_id (único y permanente)
    // El modo offline-first funcionará porque el formulario carga desde IndexedDB
    this.router.navigate(['/registro-form', { id: registro.local_id }]);
  }

  canEdit(): boolean {
    // Verificar permiso de edición de registros
    return (
      this.authService.hasPermission('registros.update') ||
      this.authService.hasPermission('registros.edit')
    );
  }

  getSyncIcon(registro: any): string {
    return registro.synced ? 'cloud-done-outline' : 'cloud-upload-outline';
  }

  getSyncColor(registro: any): string {
    return registro.synced ? 'success' : 'warning';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  goToForm() {
    this.router.navigate(['/registro-form']);
  }

  ngOnDestroy() {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }
}
