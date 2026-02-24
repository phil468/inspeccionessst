import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular/standalone';
import { SyncService } from './services/sync.service';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, IonicModule],
})
export class AppComponent implements OnInit {
  constructor(
    private syncService: SyncService,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private alertController: AlertController,
    private databaseService: DatabaseService,
  ) {}

  async ngOnInit() {
    // Verificar que la base de datos esté accesible
    try {
      await this.databaseService.ensureOpen();
    } catch (error: any) {
      console.error('Error crítico con la base de datos:', error);
      // Si ensureOpen no pudo recuperar la BD (no hizo reload automático),
      // intentar resetear y recargar como último recurso
      try {
        await DatabaseService.resetDatabase();
      } catch (resetErr) {
        console.error('No se pudo resetear la BD:', resetErr);
      }
      return;
    }

    // Iniciar auto-sync cuando la app carga
    this.initializeAutoSync();

    // Escuchar conflictos de sincronización
    this.listenToSyncConflicts();

    // Inicializar push notifications
    this.initializePushNotifications();
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

  private async initializePushNotifications() {
    // Inicializar solo cuando el usuario esté autenticado
    this.authService.authState$.subscribe(async (isAuth) => {
      if (isAuth) {
        console.log('🔔 Inicializando push notifications...');
        await this.pushNotificationService.initialize();
      }
    });
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
            c.server_updated_at,
          ).toLocaleString()}\n   Tu cambio: ${new Date(
            c.client_updated_at,
          ).toLocaleString()}`,
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
