import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { SyncService } from '../services/sync.service';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  personCircleOutline,
  syncOutline,
  addCircleOutline,
  listOutline,
  settingsOutline,
  clipboardOutline,
  documentsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class HomePage {
  user: any = null;
  syncStatus = {
    total: 0,
    sincronizados: 0,
    pendientes: 0,
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private syncService: SyncService
  ) {
    addIcons({
      logOutOutline,
      personCircleOutline,
      syncOutline,
      addCircleOutline,
      listOutline,
      settingsOutline,
      clipboardOutline,
      documentsOutline,
    });
  }

  ionViewWillEnter() {
    this.loadUserData();
    this.loadSyncStatus();
  }

  loadUserData() {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  async loadSyncStatus() {
    try {
      const status = await this.syncService.getLocalStatus();
      this.syncStatus = status;
    } catch (error) {
      console.error('Error al cargar estado de sincronización:', error);
    }
  }

  goToRegistroForm() {
    this.router.navigate(['/registro-form']);
  }

  goToHistorial() {
    this.router.navigate(['/registro-lista']);
  }

  goToMantenimiento() {
    this.router.navigate(['/mantenimiento']);
  }

  goToInspeccionForm() {
    this.router.navigate(['/inspecciones/form']);
  }

  goToInspeccionLista() {
    this.router.navigate(['/inspecciones']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  hasAnyMantenimientoPermission(): boolean {
    const permissions = [
      'campanias.view',
      'materiales.view',
      'fundos.view',
      'lotes.view',
      'motivos.view',
      'users.view',
      'roles.view',
    ];
    return permissions.some((p) => this.hasPermission(p));
  }
}
