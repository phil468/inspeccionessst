import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { MenuController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  listOutline,
  documentTextOutline,
  settingsOutline,
  flaskOutline,
  cubeOutline,
  businessOutline,
  gridOutline,
  flagOutline,
  logOutOutline,
  personCircleOutline,
  shieldOutline,
  clipboardOutline,
  briefcaseOutline,
  layersOutline,
  peopleOutline,
  keyOutline,
} from 'ionicons/icons';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonicModule],
})
export class MenuComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      title: 'Inicio',
      icon: 'home-outline',
      route: '/home',
    },
    {
      title: 'Registros',
      icon: 'list-outline',
      route: '/registro-lista',
    },
    {
      title: 'Mantenimiento',
      icon: 'settings-outline',
      children: [
        {
          title: 'Campañas',
          icon: 'flask-outline',
          route: '/campanias',
          permission: 'campanias.view',
        },
        {
          title: 'Materiales',
          icon: 'cube-outline',
          route: '/materiales',
          permission: 'materiales.view',
        },
        {
          title: 'Fundos',
          icon: 'business-outline',
          route: '/fundos',
          permission: 'fundos.view',
        },
        {
          title: 'Lotes',
          icon: 'grid-outline',
          route: '/lotes',
          permission: 'lotes.view',
        },
        {
          title: 'Motivos',
          icon: 'flag-outline',
          route: '/motivos',
          permission: 'motivos.view',
        },
      ],
    },
    {
      title: 'Administración',
      icon: 'shield-outline',
      children: [
        {
          title: 'Usuarios',
          icon: 'people-outline',
          route: '/usuarios',
          permission: 'users.manage',
        },
        {
          title: 'Roles y Permisos',
          icon: 'key-outline',
          route: '/roles',
          permission: 'roles.manage',
        },
      ],
    },
  ];

  userName: string = '';
  userEmail: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private menuController: MenuController,
    private alertController: AlertController
  ) {
    addIcons({
      homeOutline,
      listOutline,
      documentTextOutline,
      settingsOutline,
      flaskOutline,
      cubeOutline,
      businessOutline,
      gridOutline,
      flagOutline,
      logOutOutline,
      personCircleOutline,
      shieldOutline,
      clipboardOutline,
      briefcaseOutline,
      layersOutline,
      peopleOutline,
      keyOutline,
    });
    console.log('📱 MenuComponent constructor ejecutado');
  }

  ngOnInit() {
    console.log('📱 MenuComponent ngOnInit ejecutado');
    this.loadUserInfo();
  }

  loadUserInfo() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.name || 'Usuario';
      this.userEmail = currentUser.email || '';
    }
  }

  hasPermission(permission?: string): boolean {
    if (!permission) {
      return true; // Items sin permisos son visibles para todos
    }
    return this.authService.hasPermission(permission);
  }

  async navigateTo(route?: string) {
    if (route) {
      await this.menuController.close();
      this.router.navigate([route]);
    }
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmar cierre de sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: async () => {
            await this.menuController.close();
            this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });

    await alert.present();
  }
}
