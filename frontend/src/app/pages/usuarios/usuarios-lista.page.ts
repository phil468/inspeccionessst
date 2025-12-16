import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Usuario } from '../../models/usuario.model';
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
  selector: 'app-usuarios-lista',
  templateUrl: './usuarios-lista.page.html',
  styleUrls: ['./usuarios-lista.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class UsuariosListaPage implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
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
    this.loadUsuarios();
  }

  ionViewWillEnter() {
    this.loadUsuarios();
  }

  async loadUsuarios() {
    this.isLoading = true;
    try {
      const response: any = await this.usuarioService.getUsuarios();
      console.log('Response from API:', response);
      this.usuarios = response.data || response;
      this.usuariosFiltrados = [...this.usuarios];
      this.isLoading = false;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      this.isLoading = false;
    }
  }

  filterUsuarios() {
    const term = this.searchTerm.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(
      (usuario) =>
        usuario.name.toLowerCase().includes(term) ||
        usuario.email.toLowerCase().includes(term)
    );
  }

  nuevo() {
    if (!this.authService.hasPermission('users.manage')) {
      this.showAlert('No tienes permisos para crear usuarios');
      return;
    }
    this.router.navigate(['/usuarios/nuevo']);
  }

  editar(id: number) {
    if (!this.authService.hasPermission('users.manage')) {
      this.showAlert('No tienes permisos para editar usuarios');
      return;
    }
    this.router.navigate([`/usuarios/editar/${id}`]);
  }

  async eliminar(usuario: Usuario) {
    if (!this.authService.hasPermission('users.manage')) {
      this.showAlert('No tienes permisos para eliminar usuarios');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar al usuario ${usuario.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminacion(usuario.id!);
          },
        },
      ],
    });

    await alert.present();
  }

  async confirmarEliminacion(id: number) {
    try {
      await this.usuarioService.deleteUsuario(id);
      this.showAlert('Usuario eliminado correctamente');
      this.loadUsuarios();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      this.showAlert('Error al eliminar usuario');
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
