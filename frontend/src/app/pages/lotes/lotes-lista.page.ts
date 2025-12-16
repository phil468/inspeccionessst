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
  selector: 'app-lotes-lista',
  templateUrl: './lotes-lista.page.html',
  styleUrls: ['./lotes-lista.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LotesListaPage implements OnInit {
  lotes: any[] = [];
  lotesFiltrados: any[] = [];
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
    await this.loadLotes();
  }

  async ionViewWillEnter() {
    await this.loadLotes();
  }

  async loadLotes() {
    this.loading = true;
    try {
      // 1. Cargar desde IndexedDB primero (offline-first)
      this.lotes = await this.storageService.getLotes();
      this.lotesFiltrados = this.lotes;

      // 2. Si hay conexión, actualizar desde API
      const isOnline = await this.networkService.getCurrentStatus();
      if (isOnline) {
        try {
          const response = await this.apiService.get<any>('lotes');
          if (response.data) {
            // Actualizar IndexedDB
            await this.storageService.updateLotes(response.data);

            // Actualizar vista
            this.lotes = response.data;
            this.lotesFiltrados = this.lotes;
          }
        } catch (apiError) {
          console.warn(
            'Error al actualizar desde API, usando datos locales:',
            apiError
          );
        }
      }
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      this.showToast('Error al cargar lotes', 'danger');
    } finally {
      this.loading = false;
    }
  }

  filterLotes(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    if (!this.searchTerm) {
      this.lotesFiltrados = this.lotes;
      return;
    }

    this.lotesFiltrados = this.lotes.filter((lote: any) => {
      return (
        lote.nombre?.toLowerCase().includes(this.searchTerm) ||
        lote.fundo?.nombre?.toLowerCase().includes(this.searchTerm)
      );
    });
  }

  async nuevoLote() {
    this.router.navigate(['/lotes/nuevo']);
  }

  async editarLote(id: number) {
    this.router.navigate(['/lotes/editar', id]);
  }

  async eliminarLote(lote: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el lote "${lote.nombre}"?`,
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
              await this.apiService.delete(`lotes/${lote.id}`);
              this.showToast('Lote eliminado correctamente', 'success');
              await this.loadLotes();
            } catch (error) {
              console.error('Error al eliminar lote:', error);
              this.showToast('Error al eliminar lote', 'danger');
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
