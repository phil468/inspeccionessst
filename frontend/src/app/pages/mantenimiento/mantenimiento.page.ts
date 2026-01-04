import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  cubeOutline,
  leafOutline,
  gridOutline,
  bookmarkOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  businessOutline,
  homeOutline,
  personOutline,
  briefcaseOutline,
} from 'ionicons/icons';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  permission: string;
  description: string;
}

@Component({
  selector: 'app-mantenimiento',
  templateUrl: './mantenimiento.page.html',
  styleUrls: ['./mantenimiento.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class MantenimientoPage {
  menuItems: MenuItem[] = [
    {
      title: 'Campañas',
      icon: 'calendar-outline',
      route: '/campanias',
      permission: 'campanias.view',
      description: 'Gestionar campañas agrícolas',
    },
    // {
    //   title: 'Materiales',
    //   icon: 'cube-outline',
    //   route: '/materiales',
    //   permission: 'materiales.view',
    //   description: 'Gestionar materiales y productos',
    // },
    {
      title: 'Fundos',
      icon: 'leaf-outline',
      route: '/fundos',
      permission: 'fundos.view',
      description: 'Gestionar fundos',
    },
    // {
    //   title: 'Lotes',
    //   icon: 'grid-outline',
    //   route: '/lotes',
    //   permission: 'lotes.view',
    //   description: 'Gestionar lotes',
    // },
    // {
    //   title: 'Motivos',
    //   icon: 'bookmark-outline',
    //   route: '/motivos',
    //   permission: 'motivos.view',
    //   description: 'Gestionar motivos de aplicación',
    // },
    {
      title: 'Usuarios',
      icon: 'people-outline',
      route: '/usuarios',
      permission: 'usuarios.view',
      description: 'Gestionar usuarios del sistema',
    },
    {
      title: 'Roles y Permisos',
      icon: 'shield-checkmark-outline',
      route: '/roles',
      permission: 'roles.view',
      description: 'Gestionar roles y permisos',
    },
    //areas, empresas
    {
      title: 'Áreas',
      icon: 'business-outline',
      route: '/areas',
      permission: 'areas.view',
      description: 'Gestionar áreas de la empresa',
    },
    {
      title: 'Empresas',
      icon: 'home-outline',
      route: '/empresas',
      permission: 'empresas.view',
      description: 'Gestionar empresas',
    },
    {
      title: 'Personal',
      icon: 'person-outline',
      route: '/personal',
      permission: 'personal.view',
      description: 'Gestionar personal',
    },
    {
      title: 'Cargos',
      icon: 'briefcase-outline',
      route: '/cargos',
      permission: 'cargos.view',
      description: 'Gestionar cargos',
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      cubeOutline,
      leafOutline,
      gridOutline,
      bookmarkOutline,
      peopleOutline,
      shieldCheckmarkOutline,
      businessOutline,
      homeOutline,
      personOutline,
      briefcaseOutline,
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  get availableItems(): MenuItem[] {
    return this.menuItems.filter((item) => this.hasPermission(item.permission));
  }
}
