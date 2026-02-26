import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  ToastController,
  LoadingController,
  AlertController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../../services/database.service';
import { ApiService } from '../../../services/api.service';
import { NetworkService } from '../../../services/network.service';
import { Area, Empresa } from '../../../models/catalogo.model';
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  businessOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-areas-lista',
  templateUrl: './areas-lista.page.html',
  styleUrls: ['./areas-lista.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AreasListaPage implements OnInit {
  areas: Area[] = [];
  areasFiltradas: Area[] = [];
  empresas: Empresa[] = [];
  searchTerm = '';
  empresaFiltro: string = 'all';
  isOnline = false;

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private apiService: ApiService,
    private networkService: NetworkService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController,
  ) {
    addIcons({
      addOutline,
      searchOutline,
      createOutline,
      trashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      businessOutline,
    });
  }

  async ngOnInit() {
    this.checkConnectivity();
    await this.loadEmpresas();
    await this.loadAreas();
  }

  async ionViewWillEnter() {
    await this.loadAreas();
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  async loadEmpresas() {
    try {
      if (this.isOnline) {
        const response = await this.apiService.get<{
          success: boolean;
          data: Empresa[];
        }>('/empresas');
        if (response.success) {
          this.empresas = response.data;
        }
      } else {
        this.empresas = await this.databaseService.getEmpresas();
      }
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
    }
  }

  async loadAreas() {
    const loading = await this.loadingController.create({
      message: 'Cargando áreas...',
    });
    await loading.present();

    try {
      if (this.isOnline) {
        const response = await this.apiService.get<{
          success: boolean;
          data: Area[];
        }>('/areas?solo_activas=false');
        if (response.success) {
          this.areas = response.data;
          await this.databaseService.areas.clear();
          await this.databaseService.areas.bulkAdd(this.areas);
        }
      } else {
        this.areas = await this.databaseService.getAreas();
      }

      this.areasFiltradas = [...this.areas];
      this.filterAreas();
    } catch (error: any) {
      console.error('Error al cargar áreas:', error);
      await this.showToast('Error al cargar áreas: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  filterAreas() {
    let filtradas = [...this.areas];

    // Filtrar por empresa
    if (this.empresaFiltro && this.empresaFiltro !== 'all') {
      const empresaId = Number(this.empresaFiltro);
      filtradas = filtradas.filter((area) => area.empresa_id === empresaId);
    }

    // Filtrar por búsqueda
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      filtradas = filtradas.filter(
        (area) =>
          area.name.toLowerCase().includes(term) ||
          area.centro_costo?.toLowerCase().includes(term) ||
          this.getNombreEmpresa(area.empresa_id).toLowerCase().includes(term),
      );
    }

    this.areasFiltradas = filtradas;
  }

  getNombreEmpresa(empresaId: number): string {
    const empresa = this.empresas.find((e) => e.id === empresaId);
    return empresa ? empresa.name : 'Desconocida';
  }

  async toggleActivo(area: Area, event: any) {
    event.stopPropagation();
    const nuevoEstado = event.detail.checked;

    if (!this.isOnline) {
      event.target.checked = area.activo;
      await this.showToast(
        'Debes estar conectado para cambiar el estado',
        'warning',
      );
      return;
    }

    try {
      await this.apiService.put(`/areas/${area.id}`, { activo: nuevoEstado });
      area.activo = nuevoEstado;
      await this.showToast(
        `Área ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
        'success',
      );
    } catch (error: any) {
      event.target.checked = area.activo;
      await this.showToast(
        'Error al cambiar estado: ' + error.message,
        'danger',
      );
    }
  }

  async nuevaArea() {
    if (!this.isOnline) {
      await this.showToast('Debes estar conectado para crear áreas', 'warning');
      return;
    }
    this.router.navigate(['/areas/form']);
  }

  async editarArea(area: Area) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para editar áreas',
        'warning',
      );
      return;
    }
    this.router.navigate(['/areas/form', area.id]);
  }

  async eliminarArea(area: Area) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para eliminar áreas',
        'warning',
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el área "${area.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.confirmarEliminacion(area);
          },
        },
      ],
    });

    await alert.present();
  }

  private async confirmarEliminacion(area: Area) {
    const loading = await this.loadingController.create({
      message: 'Eliminando área...',
    });
    await loading.present();

    try {
      await this.apiService.delete(`/areas/${area.id}`);
      await this.showToast('Área eliminada exitosamente', 'success');
      await this.loadAreas();
    } catch (error: any) {
      console.error('Error al eliminar área:', error);
      await this.showToast(
        'Error al eliminar área: ' + error.message,
        'danger',
      );
    } finally {
      await loading.dismiss();
    }
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
