import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { NetworkService } from '../../services/network.service';
import { addIcons } from 'ionicons';
import {
  add,
  createOutline,
  trashOutline,
  arrowBackOutline,
  searchOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-campanias-lista',
  templateUrl: './campanias-lista.page.html',
  styleUrls: ['./campanias-lista.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class CampaniasListaPage implements OnInit {
  campanias: any[] = [];
  campaniasFiltradas: any[] = [];
  searchTerm = '';
  loading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private storageService: StorageService,
    private networkService: NetworkService,
    private alertController: AlertController,
    private toastController: ToastController,
  ) {
    addIcons({
      add,
      createOutline,
      trashOutline,
      arrowBackOutline,
      searchOutline,
    });
  }

  async ngOnInit() {
    await this.loadCampanias();
  }

  async ionViewWillEnter() {
    await this.loadCampanias();
  }

  async loadCampanias() {
    this.loading = true;
    try {
      // 1. Cargar desde IndexedDB primero (offline-first)
      this.campanias = await this.storageService.getCampanias();
      this.campaniasFiltradas = this.campanias;

      // 2. Si hay conexión, actualizar desde API
      const isOnline = await this.networkService.getCurrentStatus();
      if (isOnline) {
        try {
          const response = await this.apiService.get<any>('/campanias');
          if (response.data) {
            // Actualizar IndexedDB
            await this.storageService.updateCampanias(response.data);

            // Actualizar vista
            this.campanias = response.data;
            this.campaniasFiltradas = this.campanias;
          }
        } catch (apiError) {
          console.warn(
            'Error al actualizar desde API, usando datos locales:',
            apiError,
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar campañas:', error);
      this.showToast('Error al cargar campañas', 'danger');
    } finally {
      this.loading = false;
    }
  }

  filterCampanias(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    if (!this.searchTerm) {
      this.campaniasFiltradas = this.campanias;
      return;
    }

    this.campaniasFiltradas = this.campanias.filter((campania: any) => {
      return (
        campania.nombre?.toLowerCase().includes(this.searchTerm) ||
        campania.descripcion?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async nuevaCampania() {
    this.router.navigate(['/campanias/nuevo']);
  }

  async editarCampania(id: number) {
    this.router.navigate(['/campanias/editar', id]);
  }

  async eliminarCampania(campania: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar la campaña "${campania.nombre}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.apiService.delete(`/campanias/${campania.id}`);
              this.showToast('Campaña eliminada correctamente', 'success');
              await this.loadCampanias();
            } catch (error) {
              console.error('Error al eliminar campaña:', error);
              this.showToast('Error al eliminar campaña', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
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
    this.router.navigate(['/mantenimiento']);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
}
