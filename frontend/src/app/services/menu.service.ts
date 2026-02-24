import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SideMenuComponent } from '../components/side-menu/side-menu.component';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private menuModal: HTMLIonModalElement | null = null;

  constructor(private modalController: ModalController) {}

  async openMenu() {
    // Si ya hay un modal abierto, no abrir otro
    if (this.menuModal) {
      return;
    }

    this.menuModal = await this.modalController.create({
      component: SideMenuComponent,
      cssClass: 'side-menu-modal',
      showBackdrop: true,
      backdropDismiss: true,
      animated: true,
      mode: 'ios', // Usa animación iOS para slide desde la izquierda
    });

    this.menuModal.onDidDismiss().then(() => {
      this.menuModal = null;
    });

    await this.menuModal.present();
  }

  async closeMenu() {
    if (this.menuModal) {
      await this.menuModal.dismiss();
      this.menuModal = null;
    }
  }
}
