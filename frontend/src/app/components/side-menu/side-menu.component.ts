import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  listOutline,
  documentTextOutline,
  settingsOutline,
  flaskOutline,
  businessOutline,
  logOutOutline,
  personCircleOutline,
  shieldOutline,
  clipboardOutline,
  briefcaseOutline,
  layersOutline,
  peopleOutline,
  keyOutline,
  closeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonicModule],
})
export class SideMenuComponent implements OnInit {
  userName = '';

  constructor(
    private modalController: ModalController,
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
  ) {
    addIcons({
      homeOutline,
      listOutline,
      documentTextOutline,
      settingsOutline,
      flaskOutline,
      businessOutline,
      logOutOutline,
      personCircleOutline,
      shieldOutline,
      clipboardOutline,
      briefcaseOutline,
      layersOutline,
      peopleOutline,
      keyOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.name || 'Usuario';
    }
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  async navigateTo(route: string) {
    await this.modalController.dismiss();
    this.router.navigate([route]);
  }

  async closeMenu() {
    await this.modalController.dismiss();
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
            await this.modalController.dismiss();
            this.authService.logout();
            this.router.navigate(['/login']);
          },
        },
      ],
    });
    await alert.present();
  }
}
