import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoadingController, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { SyncService } from '../../services/sync.service';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  logoMicrosoft,
  informationCircleOutline,
  shieldCheckmarkSharp,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage implements OnInit {
  loading = false;
  showPassword = false;

  // Credenciales
  email = '';
  password = '';

  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private syncService: SyncService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingController: LoadingController,
    private toastController: ToastController,
  ) {
    addIcons({
      leafOutline,
      logoMicrosoft,
      informationCircleOutline,
      shieldCheckmarkSharp,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
    });
  }

  async ngOnInit() {
    // Si ya está autenticado, redirigir a home
    const isAuthenticated = this.authService.isAuthenticated;
    if (isAuthenticated) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
    }
  }

  async loginWithCredentials() {
    if (!this.email || !this.password) {
      this.showToast('Por favor complete todos los campos', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Login con email/password
      await this.authService.loginWithCredentials(this.email, this.password);

      // Descargar datos iniciales
      loading.message = 'Descargando datos iniciales...';
      await this.syncService.downloadCatalogos();

      loading.message = 'Descargando inspecciones...';
      await this.syncService.downloadInspecciones();

      loading.message = 'Descargando registros...';
      await this.syncService.downloadRegistros();

      await loading.dismiss();
      this.showToast('Bienvenido', 'success');

      // Redirigir a la URL solicitada si existe
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
      // navigateByUrl permite navegar a rutas con parámetros completos
      this.router.navigateByUrl(returnUrl, { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error en login:', error);
      this.showToast(error.message || 'Error al iniciar sesión', 'danger');
    }
  }

  async loginWithMicrosoft() {
    try {
      this.loading = true;

      // Obtener URL de Microsoft
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const response = await this.authService.getMicrosoftLoginUrl(returnUrl);

      if (response.success && response.redirect_url) {
        // Redirigir a Microsoft OAuth
        window.location.href = response.redirect_url;
      } else {
        console.error('Error al obtener URL de login');
        this.showToast('Error al conectar con Microsoft', 'danger');
      }
    } catch (error) {
      console.error('Error en login:', error);
      this.showToast('Error al iniciar sesión', 'danger');
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
