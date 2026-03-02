import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  sync,
  search,
  filterOutline,
  personOutline,
  briefcaseOutline,
  businessOutline,
  checkmarkCircle,
  closeCircle,
  warning,
  pencilOutline,
  eyeOutline,
} from 'ionicons/icons';
import { Personal, Empresa, Area, Cargo } from '../../models/catalogo.model';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { FilterPipe } from '../../pipes/filter.pipe';

@Component({
  selector: 'app-personal-lista',
  templateUrl: './personal-lista.page.html',
  styleUrls: ['./personal-lista.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonChip,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    FilterPipe,
  ],
})
export class PersonalListaPage implements OnInit {
  personal: Personal[] = [];
  personalFiltrado: Personal[] = [];
  personalMostrado: Personal[] = []; // Solo lo que se muestra

  // Paginación virtual
  pageSize: number = 50; // Mostrar 50 a la vez
  currentPage: number = 0;
  empresas: Empresa[] = [];
  areas: Area[] = [];
  cargos: Cargo[] = [];

  // Filtros
  searchTerm: string = '';
  empresaFilter: number | null = null;
  areaFilter: number | null = null;
  cargoFilter: number | null = null;
  estadoFilter: string = 'activo'; // activo, cesado, todos

  loading: boolean = false;
  syncing: boolean = false;

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {
    addIcons({
      add,
      sync,
      search,
      filterOutline,
      personOutline,
      briefcaseOutline,
      businessOutline,
      checkmarkCircle,
      closeCircle,
      warning,
      pencilOutline,
      eyeOutline,
    });
  }

  ngOnInit() {
    this.loadData();
  }

  /**
   * Cargar datos desde IndexedDB
   */
  async loadData() {
    try {
      this.loading = true;

      // Cargar catálogos
      const catalogos = await this.storageService.getCatalogos();
      if (catalogos) {
        this.empresas = catalogos.empresas || [];
        this.areas = catalogos.areas || [];
        this.cargos = catalogos.cargos || [];
      }

      // Cargar personal desde IndexedDB
      this.personal = await this.storageService.getAllPersonal();

      // Si no hay personal en IndexedDB, cargar desde API
      if (this.personal.length === 0) {
        console.log('No hay personal en IndexedDB, cargando desde API...');
        await this.loadFromApi();
      } else {
        this.applyFilters();
      }
    } catch (error) {
      console.error('Error cargando personal:', error);
      this.showToast('Error al cargar datos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cargar personal desde API
   */
  async loadFromApi() {
    try {
      const response = await this.apiService.getPersonal();

      if (response.data && Array.isArray(response.data)) {
        // Guardar en IndexedDB
        await this.storageService.savePersonal(response.data);

        // Actualizar lista local
        this.personal = response.data;
        this.applyFilters();

        console.log(`✓ ${response.data.length} registros de personal cargados`);
      }
    } catch (error) {
      console.error('Error cargando desde API:', error);
      this.showToast('Error al cargar personal desde el servidor', 'warning');
    }
  }

  /**
   * Aplicar filtros al personal
   */
  applyFilters() {
    let filtered = [...this.personal];

    // Filtro por estado
    if (this.estadoFilter === 'activo') {
      filtered = filtered.filter((p) => !p.cesado);
    } else if (this.estadoFilter === 'cesado') {
      filtered = filtered.filter((p) => p.cesado);
    }

    // Filtro por empresa
    if (this.empresaFilter) {
      filtered = filtered.filter((p) => p.empresa_id === this.empresaFilter);
    }

    // Filtro por área
    if (this.areaFilter) {
      filtered = filtered.filter((p) => p.area_id === this.areaFilter);
    }

    // Filtro por cargo
    if (this.cargoFilter) {
      filtered = filtered.filter((p) => p.cargo_id === this.cargoFilter);
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.dni?.toLowerCase().includes(term),
      );
    }

    this.personalFiltrado = filtered;

    // Resetear paginación y cargar primera página
    this.currentPage = 0;
    this.loadNextPage(true);
  }

  /**
   * Cargar siguiente página (paginación virtual)
   */
  loadNextPage(reset: boolean = false) {
    if (reset) {
      this.personalMostrado = [];
      this.currentPage = 0;
    }

    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const nextBatch = this.personalFiltrado.slice(start, end);

    if (reset) {
      this.personalMostrado = nextBatch;
    } else {
      this.personalMostrado = [...this.personalMostrado, ...nextBatch];
    }

    this.currentPage++;
  }

  /**
   * Manejar evento de scroll infinito
   */
  onIonInfinite(event: any) {
    const start = this.currentPage * this.pageSize;

    if (start < this.personalFiltrado.length) {
      this.loadNextPage();
      setTimeout(() => event.target.complete(), 300);
    } else {
      event.target.complete();
      event.target.disabled = true;
    }
  }

  /**
   * Limpiar filtros
   */
  clearFilters() {
    this.searchTerm = '';
    this.empresaFilter = null;
    this.areaFilter = null;
    this.cargoFilter = null;
    this.estadoFilter = 'activo';
    this.applyFilters();
  }

  /**
   * Sincronizar desde API externa
   */
  async syncFromExternalApi() {
    const alert = await this.alertController.create({
      header: 'Confirmar Sincronización',
      message:
        '¿Desea sincronizar el personal desde el API externa? Esto puede tomar varios minutos.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sincronizar',
          handler: async () => {
            await this.performSync();
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Realizar sincronización directa
   */
  async performSync() {
    const loading = await this.loadingController.create({
      message: 'Sincronizando personal desde API externa...',
      spinner: 'crescent',
      backdropDismiss: false,
    });

    await loading.present();

    try {
      this.syncing = true;

      const response = await this.apiService.syncPersonalFromExternalApi();

      if (response && response.success) {
        // Recargar datos desde el servidor por lotes
        loading.message = 'Descargando datos actualizados...';

        try {
          const personalData = await this.apiService.getPersonal(
            undefined,
            (loaded, total) => {
              loading.message = `Descargando personal: ${loaded} de ${total}...`;
            },
          );
          await this.storageService.clearPersonal();
          if (personalData.data && personalData.data.length > 0) {
            loading.message = 'Guardando en almacenamiento local...';
            await this.storageService.savePersonal(personalData.data);
          }
          await this.loadData();
        } catch (reloadError) {
          console.error('Error recargando datos post-sync:', reloadError);
          this.showToast(
            'Sincronización exitosa, pero hubo un error al actualizar la lista. Use pull-to-refresh.',
            'warning',
          );
        }

        await loading.dismiss();

        // Mostrar resultado con estadísticas
        const stats = response.stats;
        const message = stats
          ? `Sincronización completada: ${stats.nuevos || 0} nuevos, ${stats.actualizados || 0} actualizados, ${stats.cesados || 0} cesados`
          : response.message || 'Sincronización completada';
        this.showToast(message, 'success');
      } else {
        await loading.dismiss();
        this.showToast(
          response?.message || 'Error en la sincronización',
          'danger',
        );
      }
    } catch (error: any) {
      console.error('Error sincronizando:', error);
      await loading.dismiss();

      let errorMsg = 'Error al sincronizar personal';

      if (
        error?.status === 401 ||
        error?.error?.message?.includes('Unauthenticated')
      ) {
        errorMsg = 'Sesión expirada. Por favor inicie sesión nuevamente.';
      } else if (error?.status === 409) {
        errorMsg = 'Ya hay una sincronización en curso. Por favor espere.';
      } else if (error?.error?.message) {
        errorMsg = error.error.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      this.showToast(errorMsg, 'danger');
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Refrescar datos (pull to refresh)
   */
  async handleRefresh(event: any) {
    try {
      // Cargar desde servidor por lotes
      const response = await this.apiService.getPersonal();

      if (response.data) {
        // Guardar en IndexedDB
        await this.storageService.clearPersonal();
        await this.storageService.savePersonal(response.data);

        // Recargar lista
        await this.loadData();

        this.showToast(
          `${response.data.length} registros actualizados`,
          'success',
        );
      }
    } catch (error) {
      console.error('Error refrescando:', error);
      this.showToast('Error al actualizar datos', 'danger');
    } finally {
      event.target.complete();
    }
  }

  /**
   * Obtener nombre de empresa
   */
  getEmpresaNombre(empresaId: number | undefined): string {
    if (!empresaId) return '-';
    const empresa = this.empresas.find((e) => e.id === empresaId);
    return empresa?.name || '-';
  }

  /**
   * Obtener nombre de área
   */
  getAreaNombre(areaId: number): string {
    const area = this.areas.find((a) => a.id === areaId);
    return area?.name || '-';
  }

  /**
   * Obtener nombre de cargo
   */
  getCargoNombre(cargoId: number | undefined): string {
    if (!cargoId) return '-';
    const cargo = this.cargos.find((c) => c.id === cargoId);
    return cargo?.name || '-';
  }

  /**
   * Ver detalles de un personal
   */
  verDetalle(personal: Personal) {
    this.router.navigate(['/personal/detalle', personal.id]);
  }

  /**
   * Editar personal
   */
  editarPersonal(personal: Personal) {
    this.router.navigate(['/personal/editar', personal.id]);
  }

  /**
   * Ir a formulario de nuevo personal
   */
  nuevoPersonal() {
    this.router.navigate(['/personal/nuevo']);
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
