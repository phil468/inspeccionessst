import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SyncService } from '../../services/sync.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.page.html',
  styleUrls: ['./auth-callback.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AuthCallbackPage implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private syncService: SyncService,
    private loadingController: LoadingController
  ) {}

  async ngOnInit() {
    const loading = await this.loadingController.create({
      message: 'Completando autenticación...',
    });
    await loading.present();

    try {
      // Obtener parámetros de la URL
      const sessionKey = this.route.snapshot.queryParams['session'];
      const error = this.route.snapshot.queryParams['error'];

      if (error) {
        console.error('Error en callback:', error);
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'authentication_failed' },
        });
        return;
      }

      if (!sessionKey) {
        console.error('No se recibió session key en el callback');
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'no_session' },
        });
        return;
      }

      // Obtener datos de sesión desde el backend
      loading.message = 'Obteniendo datos de sesión...';

      const sessionResponse = await fetch(
        `${environment.apiUrl}/auth/session?session=${sessionKey}`
      );

      if (!sessionResponse.ok) {
        throw new Error('Error obteniendo datos de sesión');
      }

      const sessionData = await sessionResponse.json();

      if (
        !sessionData.success ||
        !sessionData.data.token ||
        !sessionData.data.user
      ) {
        console.error('Datos incompletos en la sesión');
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'invalid_session' },
        });
        return;
      }

      // Guardar sesión
      this.authService.saveSession({
        success: true,
        data: {
          user: sessionData.data.user,
          token: sessionData.data.token,
        },
      });

      // Actualizar mensaje de loading
      loading.message = 'Descargando datos iniciales...';

      // Descargar datos iniciales (catálogos y registros)
      try {
        console.log('📥 Iniciando descarga de datos después del login...');
        await this.syncService.downloadCatalogos();
        await this.syncService.downloadRegistros();
        console.log('✅ Datos iniciales descargados correctamente');
      } catch (syncError) {
        console.error('⚠️ Error descargando datos iniciales:', syncError);
        // No bloqueamos el login si falla la descarga, se puede intentar después
      }

      await loading.dismiss();

      // Redirigir al home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error procesando callback:', error);
      await loading.dismiss();
      this.router.navigate(['/login'], {
        queryParams: { error: 'processing_error' },
      });
    }
  }
}
