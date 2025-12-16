import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  addCircleOutline,
  listOutline,
  menuOutline,
  ellipsisVerticalOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TabsPage {
  constructor(private menuController: MenuController) {
    addIcons({
      homeOutline,
      addCircleOutline,
      listOutline,
      menuOutline,
      ellipsisVerticalOutline,
    });
  }

  async openMenu() {
    console.log('🔍 Click en botón Más - Abriendo menú...');
    const result = await this.menuController.open();
    console.log('✅ Menú abierto:', result);
  }
}
