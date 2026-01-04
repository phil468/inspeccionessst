import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private apiUrl = `${environment.apiUrl}/push-notifications`;

  constructor(private http: HttpClient, private platform: Platform) {}

  /**
   * Inicializar push notifications
   */
  async initialize(): Promise<void> {
    // Solo en dispositivos móviles
    if (!this.platform.is('capacitor')) {
      console.log(
        'Push notifications solo disponibles en dispositivos móviles'
      );
      return;
    }

    try {
      // Solicitar permisos
      const permission = await PushNotifications.requestPermissions();

      if (permission.receive === 'granted') {
        await PushNotifications.register();
        console.log('Push notifications registradas');

        // Listeners
        this.addListeners();
      } else {
        console.log('Permisos de notificaciones denegados');
      }
    } catch (error) {
      console.error('Error al inicializar push notifications:', error);
    }
  }

  /**
   * Agregar listeners para eventos de push
   */
  private addListeners(): void {
    // Token recibido
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push token:', token.value);
      await this.registerToken(token.value);
    });

    // Error al registrar
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error en registro push:', error);
    });

    // Notificación recibida (app en foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Notificación recibida:', notification);
        // Aquí puedes mostrar una alerta o toast
        this.handleNotification(notification);
      }
    );

    // Notificación clickeada (app en background o cerrada)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Notificación clickeada:', notification);
        // Navegar a la pantalla correspondiente
        this.handleNotificationTap(notification);
      }
    );
  }

  /**
   * Registrar token en el backend
   */
  private async registerToken(token: string): Promise<void> {
    try {
      const platform = this.getPlatform();
      const deviceId = await this.getDeviceId();

      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, {
          token,
          platform,
          device_id: deviceId,
        })
      );

      console.log('Token registrado en backend:', response);
    } catch (error) {
      console.error('Error al registrar token:', error);
    }
  }

  /**
   * Desactivar token
   */
  async deactivateToken(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/deactivate`, { token })
      );
      console.log('Token desactivado');
    } catch (error) {
      console.error('Error al desactivar token:', error);
    }
  }

  /**
   * Obtener tokens del usuario
   */
  async getUserTokens(): Promise<any> {
    try {
      return await firstValueFrom(this.http.get(`${this.apiUrl}/tokens`));
    } catch (error) {
      console.error('Error al obtener tokens:', error);
      return null;
    }
  }

  /**
   * Enviar notificación de prueba
   */
  async sendTestNotification(): Promise<any> {
    try {
      return await firstValueFrom(this.http.post(`${this.apiUrl}/test`, {}));
    } catch (error) {
      console.error('Error al enviar notificación de prueba:', error);
      throw error;
    }
  }

  /**
   * Manejar notificación recibida (foreground)
   */
  private handleNotification(notification: PushNotificationSchema): void {
    console.log('Procesando notificación:', notification);
    // Aquí puedes mostrar un toast o alerta local
    // También puedes emitir un evento para que otros componentes reaccionen
  }

  /**
   * Manejar tap en notificación (background/cerrada)
   */
  private handleNotificationTap(notification: ActionPerformed): void {
    console.log('Usuario hizo tap en notificación:', notification);

    // Navegar según el tipo de notificación
    const data = notification.notification.data;

    if (data && data.type === 'inspeccion') {
      // Navegar a la inspección
      // this.router.navigate(['/tabs/inspecciones/form', data.inspeccion_id]);
    }
  }

  /**
   * Obtener plataforma
   */
  private getPlatform(): string {
    if (this.platform.is('ios')) return 'ios';
    if (this.platform.is('android')) return 'android';
    return 'web';
  }

  /**
   * Obtener ID del dispositivo
   */
  private async getDeviceId(): Promise<string | null> {
    // Puedes usar @capacitor/device para obtener el ID único
    // Por ahora retornamos null
    return null;
  }

  /**
   * Remover todos los listeners
   */
  async removeAllListeners(): Promise<void> {
    await PushNotifications.removeAllListeners();
  }
}
