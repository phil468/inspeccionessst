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
import { Empresa } from '../../../models/catalogo.model';
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-empresas-lista',
  templateUrl: './empresas-lista.page.html',
  styleUrls: ['./empresas-lista.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class EmpresasListaPage implements OnInit {
  empresas: Empresa[] = [];
  empresasFiltradas: Empresa[] = [];
  searchTerm = '';
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
    });
  }

  async ngOnInit() {
    this.checkConnectivity();
    await this.loadEmpresas();
  }

  async ionViewWillEnter() {
    await this.loadEmpresas();
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  async loadEmpresas() {
    const loading = await this.loadingController.create({
      message: 'Cargando empresas...',
    });
    await loading.present();

    try {
      if (this.isOnline) {
        // Cargar desde API
        const response = await this.apiService.get<{
          success: boolean;
          data: Empresa[];
        }>('/empresas');
        if (response.success) {
          this.empresas = response.data;
          // Guardar en IndexedDB para uso offline
          await this.databaseService.empresas.clear();
          await this.databaseService.empresas.bulkAdd(this.empresas);
        }
      } else {
        // Cargar desde IndexedDB
        this.empresas = await this.databaseService.getEmpresas();
      }

      this.empresasFiltradas = [...this.empresas];
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
      await this.showToast(
        'Error al cargar empresas: ' + error.message,
        'danger',
      );
    } finally {
      await loading.dismiss();
    }
  }

  filterEmpresas() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.empresasFiltradas = [...this.empresas];
      return;
    }

    this.empresasFiltradas = this.empresas.filter(
      (empresa) =>
        empresa.name.toLowerCase().includes(term) ||
        empresa.razon_social?.toLowerCase().includes(term) ||
        empresa.ruc?.toLowerCase().includes(term),
    );
  }

  async nuevaEmpresa() {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para crear empresas',
        'warning',
      );
      return;
    }
    this.router.navigate(['/empresas/form']);
  }

  async editarEmpresa(empresa: Empresa) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para editar empresas',
        'warning',
      );
      return;
    }
    this.router.navigate(['/empresas/form', empresa.id]);
  }

  async eliminarEmpresa(empresa: Empresa) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para eliminar empresas',
        'warning',
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar la empresa "${empresa.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.confirmarEliminacion(empresa);
          },
        },
      ],
    });

    await alert.present();
  }

  private async confirmarEliminacion(empresa: Empresa) {
    const loading = await this.loadingController.create({
      message: 'Eliminando empresa...',
    });
    await loading.present();

    try {
      await this.apiService.delete(`/empresas/${empresa.id}`);
      await this.showToast('Empresa eliminada exitosamente', 'success');
      await this.loadEmpresas();
    } catch (error: any) {
      console.error('Error al eliminar empresa:', error);
      await this.showToast(
        'Error al eliminar empresa: ' + error.message,
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
