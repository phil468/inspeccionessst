import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
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
  selector: 'app-materiales-lista',
  templateUrl: './materiales-lista.page.html',
  styleUrls: ['./materiales-lista.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class MaterialesListaPage implements OnInit {
  materiales: any[] = [];
  materialesFiltrados: any[] = [];
  searchTerm = '';
  loading = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private storageService: StorageService,
    private networkService: NetworkService,
    private alertController: AlertController,
    private toastController: ToastController
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
    await this.loadMateriales();
  }

  async ionViewWillEnter() {
    await this.loadMateriales();
  }

  async loadMateriales() {
    this.loading = true;
    try {
      // 1. Cargar desde IndexedDB primero (offline-first)
      this.materiales = await this.storageService.getMateriales();
      this.materialesFiltrados = this.materiales;

      // 2. Si hay conexión, actualizar desde API
      const isOnline = await this.networkService.getCurrentStatus();
      if (isOnline) {
        try {
          const response = await this.apiService.get<any>('materiales');
          if (response.data) {
            // Actualizar IndexedDB
            await this.storageService.updateMateriales(response.data);

            // Actualizar vista
            this.materiales = response.data;
            this.materialesFiltrados = this.materiales;
          }
        } catch (apiError) {
          console.warn(
            'Error al actualizar desde API, usando datos locales:',
            apiError
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      this.showToast('Error al cargar materiales', 'danger');
    } finally {
      this.loading = false;
    }
  }

  filterMateriales(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    if (!this.searchTerm) {
      this.materialesFiltrados = this.materiales;
      return;
    }

    this.materialesFiltrados = this.materiales.filter((material: any) => {
      return (
        material.nombre?.toLowerCase().includes(this.searchTerm) ||
        material.codigo?.toLowerCase().includes(this.searchTerm) ||
        material.descripcion?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async nuevoMaterial() {
    this.router.navigate(['/materiales/nuevo']);
  }

  async editarMaterial(id: number) {
    this.router.navigate(['/materiales/editar', id]);
  }

  async eliminarMaterial(material: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el material "${material.nombre}"?`,
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
              await this.apiService.delete(`materiales/${material.id}`);
              this.showToast('Material eliminado correctamente', 'success');
              await this.loadMateriales();
            } catch (error) {
              console.error('Error al eliminar material:', error);
              this.showToast('Error al eliminar material', 'danger');
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
