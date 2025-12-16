import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SyncService } from '../../services/sync.service';

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
      const data = this.route.snapshot.queryParams['data'];
      const error = this.route.snapshot.queryParams['error'];

      if (error) {
        console.error('Error en callback:', error);
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'authentication_failed' },
        });
        return;
      }

      if (!data) {
        console.error('No se recibieron datos en el callback');
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'no_data' },
        });
        return;
      }

      // Decodificar datos
      const decodedData = JSON.parse(atob(data));

      if (!decodedData.token || !decodedData.user) {
        console.error('Datos incompletos en el callback');
        await loading.dismiss();
        this.router.navigate(['/login'], {
          queryParams: { error: 'invalid_data' },
        });
        return;
      }

      // Guardar sesión
      this.authService.saveSession({
        success: true,
        data: {
          user: decodedData.user,
          token: decodedData.token,
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
