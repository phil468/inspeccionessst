import { Component, OnInit } from '@angular/core';
import {
  IonApp,
  IonRouterOutlet,
  AlertController,
} from '@ionic/angular/standalone';
import { SyncService } from './services/sync.service';
import { AuthService } from './services/auth.service';
import { MenuComponent } from './components/menu/menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MenuComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private syncService: SyncService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Iniciar auto-sync cuando la app carga
    this.initializeAutoSync();

    // Escuchar conflictos de sincronización
    this.listenToSyncConflicts();
  }

  private async initializeAutoSync() {
    // Esperar a que el usuario esté autenticado
    if (this.authService.isAuthenticated) {
      console.log('🚀 Iniciando sincronización automática...');
      this.syncService.startAutoSync();
    } else {
      // Escuchar cuando el usuario se autentique
      this.authService.authState$.subscribe((isAuth) => {
        if (isAuth) {
          console.log('🚀 Usuario autenticado - Iniciando auto-sync');
          this.syncService.startAutoSync();
        } else {
          console.log('🛑 Usuario no autenticado - Deteniendo auto-sync');
          this.syncService.stopAutoSync();
        }
      });
    }
  }

  private listenToSyncConflicts() {
    this.syncService.conflicts$.subscribe(async (conflicts) => {
      if (conflicts.length > 0) {
        const mensaje =
          conflicts.length === 1
            ? '1 registro no se pudo sincronizar porque existe una versión más reciente en el servidor.'
            : `${conflicts.length} registros no se pudieron sincronizar porque existen versiones más recientes en el servidor.`;

        const alert = await this.alertController.create({
          header: '⚠️ Conflicto de Sincronización',
          message: `${mensaje}\n\nTus cambios locales se han descartado para mantener la versión más reciente del servidor.`,
          buttons: [
            {
              text: 'Ver Detalles',
              handler: () => {
                this.showConflictDetails(conflicts);
              },
            },
            {
              text: 'Entendido',
              role: 'cancel',
            },
          ],
        });

        await alert.present();
      }
    });
  }

  private async showConflictDetails(conflicts: any[]) {
    const detalles = conflicts
      .map(
        (c, i) =>
          `${i + 1}. Registro con ID ${
            c.local_id
          }...\n   Servidor actualizado: ${new Date(
            c.server_updated_at
          ).toLocaleString()}\n   Tu cambio: ${new Date(
            c.client_updated_at
          ).toLocaleString()}`
      )
      .join('\n\n');

    const alert = await this.alertController.create({
      header: 'Detalles de Conflictos',
      message: detalles,
      buttons: ['Cerrar'],
      cssClass: 'conflict-details-alert',
    });

    await alert.present();
  }
}
