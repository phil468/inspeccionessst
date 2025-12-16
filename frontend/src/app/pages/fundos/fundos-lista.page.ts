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
  selector: 'app-fundos-lista',
  templateUrl: './fundos-lista.page.html',
  styleUrls: ['./fundos-lista.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class FundosListaPage implements OnInit {
  fundos: any[] = [];
  fundosFiltrados: any[] = [];
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
    await this.loadFundos();
  }

  async ionViewWillEnter() {
    await this.loadFundos();
  }

  async loadFundos() {
    this.loading = true;
    try {
      // 1. Cargar desde IndexedDB primero (offline-first)
      this.fundos = await this.storageService.getFundos();
      this.fundosFiltrados = this.fundos;

      // 2. Si hay conexión, actualizar desde API
      const isOnline = await this.networkService.getCurrentStatus();
      if (isOnline) {
        try {
          const response = await this.apiService.get<any>('/fundos');
          if (response.data) {
            // Actualizar IndexedDB
            await this.storageService.updateFundos(response.data);

            // Actualizar vista
            this.fundos = response.data;
            this.fundosFiltrados = this.fundos;
          }
        } catch (apiError) {
          console.warn(
            'Error al actualizar desde API, usando datos locales:',
            apiError
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar fundos:', error);
      this.showToast('Error al cargar fundos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  filterFundos(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    if (!this.searchTerm) {
      this.fundosFiltrados = this.fundos;
      return;
    }

    this.fundosFiltrados = this.fundos.filter((fundo: any) => {
      return (
        fundo.nombre?.toLowerCase().includes(this.searchTerm) ||
        fundo.ubicacion?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async nuevoFundo() {
    this.router.navigate(['/fundos/nuevo']);
  }

  async editarFundo(id: number) {
    this.router.navigate(['/fundos/editar', id]);
  }

  async eliminarFundo(fundo: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el fundo "${fundo.nombre}"?`,
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
              await this.apiService.delete(`fundos/${fundo.id}`);
              this.showToast('Fundo eliminado correctamente', 'success');
              await this.loadFundos();
            } catch (error) {
              console.error('Error al eliminar fundo:', error);
              this.showToast('Error al eliminar fundo', 'danger');
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
