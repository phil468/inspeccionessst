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
  selector: 'app-motivos-lista',
  templateUrl: './motivos-lista.page.html',
  styleUrls: ['./motivos-lista.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class MotivosListaPage implements OnInit {
  motivos: any[] = [];
  motivosFiltrados: any[] = [];
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
    await this.loadMotivos();
  }

  async ionViewWillEnter() {
    await this.loadMotivos();
  }

  async loadMotivos() {
    this.loading = true;
    try {
      // 1. Cargar desde IndexedDB primero (offline-first)
      this.motivos = await this.storageService.getMotivos();
      this.motivosFiltrados = this.motivos;

      // 2. Si hay conexión, actualizar desde API
      const isOnline = await this.networkService.getCurrentStatus();
      if (isOnline) {
        try {
          const response = await this.apiService.get<any>('motivos');
          if (response.data) {
            // Actualizar IndexedDB
            await this.storageService.updateMotivos(response.data);

            // Actualizar vista
            this.motivos = response.data;
            this.motivosFiltrados = this.motivos;
          }
        } catch (apiError) {
          console.warn(
            'Error al actualizar desde API, usando datos locales:',
            apiError
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar motivos:', error);
      this.showToast('Error al cargar motivos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  filterMotivos(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    if (!this.searchTerm) {
      this.motivosFiltrados = this.motivos;
      return;
    }

    this.motivosFiltrados = this.motivos.filter((motivo: any) => {
      return (
        motivo.nombre?.toLowerCase().includes(this.searchTerm) ||
        motivo.descripcion?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async nuevoMotivo() {
    this.router.navigate(['/motivos/nuevo']);
  }

  async editarMotivo(id: number) {
    this.router.navigate(['/motivos/editar', id]);
  }

  async eliminarMotivo(motivo: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el motivo "${motivo.nombre}"?`,
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
              await this.apiService.delete(`motivos/${motivo.id}`);
              this.showToast('Motivo eliminado correctamente', 'success');
              await this.loadMotivos();
            } catch (error) {
              console.error('Error al eliminar motivo:', error);
              this.showToast('Error al eliminar motivo', 'danger');
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
