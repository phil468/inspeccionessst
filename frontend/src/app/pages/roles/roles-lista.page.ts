import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Rol } from '../../models/usuario.model';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';

import { addIcons } from 'ionicons';
import {
  add,
  createOutline,
  trashOutline,
  arrowBackOutline,
  searchOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-roles-lista',
  templateUrl: './roles-lista.page.html',
  styleUrls: ['./roles-lista.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class RolesListaPage implements OnInit {
  roles: Rol[] = [];
  rolesFiltrados: Rol[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      add,
      createOutline,
      trashOutline,
      arrowBackOutline,
      searchOutline,
    });
}

  ngOnInit() {
    this.loadRoles();
  }

  ionViewWillEnter() {
    this.loadRoles();
  }

  async loadRoles() {
    this.isLoading = true;
    try {
      const response: any = await this.usuarioService.getRoles();
      this.roles = response.data || response;
      this.rolesFiltrados = [...this.roles];
      this.isLoading = false;
    } catch (error) {
      console.error('Error cargando roles:', error);
      this.isLoading = false;
    }
  }

  filterRoles() {
    const term = this.searchTerm.toLowerCase();
    this.rolesFiltrados = this.roles.filter(
      (rol) =>
        rol.name.toLowerCase().includes(term) ||
        (rol.description && rol.description.toLowerCase().includes(term))
    );
  }

  nuevo() {
    if (!this.authService.hasPermission('roles.manage')) {
      this.showAlert('No tienes permisos para crear roles');
      return;
    }
    this.router.navigate(['/roles/nuevo']);
  }

  editar(id: number) {
    if (!this.authService.hasPermission('roles.manage')) {
      this.showAlert('No tienes permisos para editar roles');
      return;
    }
    this.router.navigate([`/roles/editar/${id}`]);
  }

  async eliminar(rol: Rol) {
    if (!this.authService.hasPermission('roles.manage')) {
      this.showAlert('No tienes permisos para eliminar roles');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el rol ${rol.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminacion(rol.id!);
          },
        },
      ],
    });

    await alert.present();
  }

  async confirmarEliminacion(id: number) {
    try {
      await this.usuarioService.deleteRol(id);
      this.showAlert('Rol eliminado correctamente');
      this.loadRoles();
    } catch (error) {
      console.error('Error eliminando rol:', error);
      this.showAlert('Error al eliminar rol');
    }
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
}
