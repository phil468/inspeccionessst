import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, downloadOutline, expandOutline } from 'ionicons/icons';

@Component({
  selector: 'app-foto-viewer-modal',
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="foto-viewer-content">
      <div class="foto-wrapper" (click)="cerrar()">
        <img
          [src]="fotoUrl"
          [alt]="titulo"
          class="foto-fullscreen"
          (click)="$event.stopPropagation()"
        />
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar color="dark">
        <ion-buttons slot="end">
          <ion-button (click)="abrirEnNuevaVentana()">
            <ion-icon slot="start" name="expand-outline"></ion-icon>
            Abrir en nueva ventana
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .foto-viewer-content {
        --background: #000;
      }

      .foto-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        padding: 16px;
      }

      .foto-fullscreen {
        max-width: 100%;
        max-height: calc(100vh - 120px);
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }

      ion-footer ion-toolbar {
        --border-width: 0;
      }
    `,
  ],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonFooter,
  ],
})
export class FotoViewerModalComponent {
  @Input() fotoUrl: string = '';
  @Input() titulo: string = 'Foto';

  constructor(private modalController: ModalController) {
    addIcons({ closeOutline, downloadOutline, expandOutline });
  }

  cerrar() {
    this.modalController.dismiss();
  }

  abrirEnNuevaVentana() {
    if (this.fotoUrl) {
      window.open(this.fotoUrl, '_blank');
    }
  }
}
