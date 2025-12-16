import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse } from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private authStateSubject: BehaviorSubject<boolean>;
  public authState$: Observable<boolean>;

  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  constructor(private apiService: ApiService, private router: Router) {
    const storedUser = localStorage.getItem(this.userKey);
    const user = storedUser ? JSON.parse(storedUser) : null;

    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.authStateSubject = new BehaviorSubject<boolean>(
      !!user && !!this.getToken()
    );
    this.authState$ = this.authStateSubject.asObservable();
  }

  /**
   * Obtener usuario actual
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  get isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  /**
   * Obtener token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtener URL de login con Microsoft
   */
  async getMicrosoftLoginUrl(): Promise<any> {
    return this.apiService.get('/auth/microsoft');
  }

  /**
   * Login con Microsoft OAuth
   */
  loginWithMicrosoft(): void {
    this.apiService.loginWithMicrosoft();
  }

  /**
   * Guardar sesión después del callback de Microsoft
   */
  saveSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authResponse.data.token);
    localStorage.setItem(this.userKey, JSON.stringify(authResponse.data.user));
    this.currentUserSubject.next(authResponse.data.user);
    this.authStateSubject.next(true);
  }

  /**
   * Obtener usuario actual (sincrónico)
   */
  async getCurrentUser(): Promise<User | null> {
    return this.currentUserValue;
  }

  /**
   * Cargar usuario actual desde el servidor
   */
  async loadCurrentUser(): Promise<void> {
    try {
      const response = await this.apiService.get('/auth/me');
      if (response && response.data) {
        localStorage.setItem(this.userKey, JSON.stringify(response.data));
        this.currentUserSubject.next(response.data);
        this.authStateSubject.next(true);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      this.logout();
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.apiService.post('/auth/logout', {});
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Limpiar sesión local
   */
  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.authStateSubject.next(false);
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.roles) {
      return false;
    }

    // Verificar en todos los roles del usuario
    return user.roles.some((role) =>
      role.permissions?.some((p) => p.name === permission)
    );
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleName: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.roles) {
      return false;
    }

    return user.roles.some((role) => role.name === roleName);
  }

  /**
   * Verificar si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.hasRole('Administrador') || this.hasRole('admin');
  }

  /**
   * Verificar si el usuario es supervisor
   */
  isSupervisor(): boolean {
    return this.hasRole('Supervisor') || this.hasRole('supervisor');
  }

  /**
   * Verificar si el usuario es operador
   */
  isOperador(): boolean {
    return this.hasRole('Operador') || this.hasRole('operador');
  }
}
