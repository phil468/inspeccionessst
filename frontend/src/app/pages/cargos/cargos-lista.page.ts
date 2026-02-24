import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  AlertController,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  briefcaseOutline,
} from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { ApiService } from '../../services/api.service';
import { NetworkService } from '../../services/network.service';
import { Cargo } from '../../models/catalogo.model';

@Component({
  selector: 'app-cargos-lista',
  templateUrl: './cargos-lista.page.html',
  styleUrls: ['./cargos-lista.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class CargosListaPage implements OnInit {
  cargos: Cargo[] = [];
  cargosFiltrados: Cargo[] = [];
  searchTerm = '';
  isOnline = false;

  constructor(
    private router: Router,
    private databaseService: DatabaseService,
    private apiService: ApiService,
    private networkService: NetworkService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {
    addIcons({
      addOutline,
      searchOutline,
      createOutline,
      trashOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      briefcaseOutline,
    });
  }

  async ngOnInit() {
    this.checkConnectivity();
    await this.loadCargos();
  }

  async ionViewWillEnter() {
    await this.loadCargos();
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  async loadCargos() {
    const loading = await this.loadingController.create({
      message: 'Cargando cargos...',
    });
    await loading.present();

    try {
      // Cargar desde IndexedDB
      this.cargos = await this.databaseService.cargos.toArray();
      this.cargosFiltrados = [...this.cargos];
    } catch (error: any) {
      console.error('Error al cargar cargos:', error);
      await this.showToast(
        'Error al cargar cargos: ' + error.message,
        'danger',
      );
    } finally {
      await loading.dismiss();
    }
  }

  filterCargos() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.cargosFiltrados = [...this.cargos];
      return;
    }

    this.cargosFiltrados = this.cargos.filter((cargo) =>
      cargo.name.toLowerCase().includes(term),
    );
  }

  async nuevoCargo() {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para crear cargos',
        'warning',
      );
      return;
    }
    this.router.navigate(['/cargos/form']);
  }

  async editarCargo(cargo: Cargo) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para editar cargos',
        'warning',
      );
      return;
    }
    this.router.navigate(['/cargos/form', cargo.id]);
  }

  async eliminarCargo(cargo: Cargo) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para eliminar cargos',
        'warning',
      );
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el cargo "${cargo.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            await this.performDelete(cargo);
          },
        },
      ],
    });

    await alert.present();
  }

  async performDelete(cargo: Cargo) {
    const loading = await this.loadingController.create({
      message: 'Eliminando cargo...',
    });
    await loading.present();

    try {
      await this.apiService.delete(`/cargos/${cargo.id}`);
      await this.showToast('Cargo eliminado exitosamente', 'success');
      await this.loadCargos();
    } catch (error: any) {
      console.error('Error al eliminar cargo:', error);
      await this.showToast(
        'Error al eliminar cargo: ' + error.message,
        'danger',
      );
    } finally {
      await loading.dismiss();
    }
  }

  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
