import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  addCircleOutline,
  listOutline,
  menuOutline,
  ellipsisVerticalOutline,
  documentTextOutline,
  clipboardOutline,
  settingsOutline,
  flaskOutline,
  businessOutline,
  briefcaseOutline,
  layersOutline,
  peopleOutline,
  shieldOutline,
  keyOutline,
  logOutOutline,
  personCircleOutline,
  closeOutline,
} from 'ionicons/icons';
import { IonIcon, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonIcon, IonTabBar, IonTabButton, IonTabs ],
})
export class TabsPage {
  isMenuOpen = false;
  userName = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      homeOutline,
      addCircleOutline,
      listOutline,
      menuOutline,
      ellipsisVerticalOutline,
      documentTextOutline,
      clipboardOutline,
      settingsOutline,
      flaskOutline,
      businessOutline,
      briefcaseOutline,
      layersOutline,
      peopleOutline,
      shieldOutline,
      keyOutline,
      logOutOutline,
      personCircleOutline,
      closeOutline,
    });
    this.loadUserInfo();
  }

  loadUserInfo() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.name || 'Usuario';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  navigateTo(route: string) {
    this.closeMenu();
    this.router.navigate([route]);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirmar cierre de sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.closeMenu();
            this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }
}
