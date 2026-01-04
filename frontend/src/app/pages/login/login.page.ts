import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  logoMicrosoft,
  informationCircleOutline,
  shieldCheckmarkSharp,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class LoginPage implements OnInit {
  loading = false;

  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router) {
    addIcons({
      leafOutline,
      logoMicrosoft,
      informationCircleOutline,
      shieldCheckmarkSharp,
    });
  }

  async ngOnInit() {
    // Si ya está autenticado, redirigir a home
    const isAuthenticated = this.authService.isAuthenticated;
    if (isAuthenticated) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }

  async loginWithMicrosoft() {
    try {
      this.loading = true;

      // Obtener URL de Microsoft
      const response = await this.authService.getMicrosoftLoginUrl();

      if (response.success && response.redirect_url) {
        // Redirigir a Microsoft OAuth
        window.location.href = response.redirect_url;
      } else {
        console.error('Error al obtener URL de login');
      }
    } catch (error) {
      console.error('Error en login:', error);
      this.loading = false;
    }
  }
}
