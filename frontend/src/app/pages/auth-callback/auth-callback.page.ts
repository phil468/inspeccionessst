import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    // const loading = await this.loadingController.create({
    //   message: 'Completando autenticación...',
    //   spinner: 'crescent'
    // });
    // await loading.present();

    try {
      // Obtener parámetros de la URL
      const sessionKey = this.route.snapshot.queryParams['session'];
      const error = this.route.snapshot.queryParams['error'];

      if (error) {
        console.error('Error en callback:', error);
        // await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'authentication_failed' },
        });
        return;
      }

      if (!sessionKey) {
        console.error('No se recibió session key en el callback');
        // await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'no_session' },
        });
        return;
      }

      // Obtener datos de sesión desde el backend
      // loading.message = 'Obteniendo datos de sesión...';

      const sessionUrl = `${environment.apiUrl}/auth/session?session=${sessionKey}`;
      console.log('🔍 Obteniendo sesión desde:', sessionUrl);

      // Agregar timeout al fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

      let sessionResponse: Response;
      try {
        sessionResponse = await fetch(sessionUrl, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error(
          '❌ Error en fetch:',
          fetchError.name,
          fetchError.message
        );
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout: El servidor no respondió a tiempo');
        }
        throw new Error(`Error de red: ${fetchError.message}`);
      }

      console.log(
        '📡 Respuesta del servidor:',
        sessionResponse.status,
        sessionResponse.statusText
      );

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error('Error obteniendo datos de sesión');
      }

      const sessionData = await sessionResponse.json();

      console.log('📦 Datos de sesión recibidos:', {
        success: sessionData.success,
        hasData: !!sessionData.data,
        hasToken: !!sessionData.data?.token,
        hasUser: !!sessionData.data?.user,
        userName: sessionData.data?.user?.nombre,
      });

      if (
        !sessionData.success ||
        !sessionData.data.token ||
        !sessionData.data.user
      ) {
        console.error('❌ Datos incompletos en la sesión:', sessionData);
        // await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'invalid_session' },
        });
        return;
      }

      // Guardar sesión
      console.log('💾 Guardando sesión en AuthService...');

      this.authService.saveSession({
        success: true,
        data: {
          user: sessionData.data.user,
          token: sessionData.data.token,
        },
      });

      console.log(
        '✅ Sesión guardada. IsAuthenticated:',
        this.authService.isAuthenticated
      );

      // Actualizar mensaje de loading
      // loading.message = 'Descargando datos iniciales...';

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

      // await loading.dismiss();

      // Redirigir al home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error procesando callback:', error);
      // await loading.dismiss();
      this.router.navigate(['/login'], {
        queryParams: { error: 'processing_error' },
      });
    }
  }
}
