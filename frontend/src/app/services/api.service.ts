import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  SyncResponse,
  Registro,
  RegistroForm,
  Catalogos,
  Campania,
  Material,
  Fundo,
  Lote,
  Motivo,
  EstadisticasRegistro,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly timeout = environment.api.timeout;
  private readonly retryAttempts = environment.api.retryAttempts;

  constructor(private http: HttpClient) {}

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  /**
   * Manejar errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage =
        error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Normalizar endpoint para asegurar que empiece con /
   */
  private normalizeEndpoint(endpoint: string): string {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }

  // ==================== MÉTODOS GENÉRICOS ====================

  /**
   * GET genérico
   */
  get<T = any>(endpoint: string, params?: HttpParams): Promise<T> {
    const url = `${this.baseUrl}${this.normalizeEndpoint(endpoint)}`;
    return this.http
      .get<T>(url, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      )
      .toPromise() as Promise<T>;
  }

  /**
   * POST genérico
   */
  post<T = any>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${this.normalizeEndpoint(endpoint)}`;
    return this.http
      .post<T>(url, data, {
        headers: this.getHeaders(),
      })
      .pipe(timeout(this.timeout), catchError(this.handleError))
      .toPromise() as Promise<T>;
  }

  /**
   * PUT genérico
   */
  put<T = any>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${this.normalizeEndpoint(endpoint)}`;
    return this.http
      .put<T>(url, data, {
        headers: this.getHeaders(),
      })
      .pipe(timeout(this.timeout), catchError(this.handleError))
      .toPromise() as Promise<T>;
  }

  /**
   * DELETE genérico
   */
  delete<T = any>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${this.normalizeEndpoint(endpoint)}`;
    return this.http
      .delete<T>(url, { headers: this.getHeaders() })
      .pipe(timeout(this.timeout), catchError(this.handleError))
      .toPromise() as Promise<T>;
  }

  // ==================== AUTENTICACIÓN ====================

  /**
   * Login con Microsoft OAuth
   */
  loginWithMicrosoft(): void {
    window.location.href = `${this.baseUrl}/auth/microsoft`;
  }

  /**
   * Logout
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        `${this.baseUrl}/auth/logout`,
        {},
        { headers: this.getHeaders() }
      )
      .pipe(timeout(this.timeout), catchError(this.handleError));
  }

  /**
   * Obtener información del usuario autenticado
   */
  getCurrentUser(): Observable<ApiResponse<any>> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/auth/user`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  // ==================== CATÁLOGOS ====================

  /**
   * Obtener todos los catálogos
   */
  getCatalogos(): Observable<ApiResponse<Catalogos>> {
    return this.http
      .get<ApiResponse<Catalogos>>(`${this.baseUrl}/sync/catalogos`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener campañas activas
   */
  getCampanias(): Observable<ApiResponse<Campania[]>> {
    return this.http
      .get<ApiResponse<Campania[]>>(`${this.baseUrl}/campanias`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener materiales activos
   */
  getMateriales(): Observable<ApiResponse<Material[]>> {
    return this.http
      .get<ApiResponse<Material[]>>(`${this.baseUrl}/materiales`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener fundos activos
   */
  getFundos(): Observable<ApiResponse<Fundo[]>> {
    return this.http
      .get<ApiResponse<Fundo[]>>(`${this.baseUrl}/fundos`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener lotes de un fundo
   */
  getLotesByFundo(fundoId: number): Observable<ApiResponse<Lote[]>> {
    return this.http
      .get<ApiResponse<Lote[]>>(`${this.baseUrl}/fundos/${fundoId}/lotes`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener motivos activos
   */
  getMotivos(): Observable<ApiResponse<Motivo[]>> {
    return this.http
      .get<ApiResponse<Motivo[]>>(`${this.baseUrl}/motivos`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  // ==================== REGISTROS ====================

  /**
   * Obtener registros con paginación
   */
  getRegistros(
    page: number = 1,
    perPage: number = 50
  ): Observable<PaginatedResponse<Registro>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http
      .get<PaginatedResponse<Registro>>(`${this.baseUrl}/registros`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Crear nuevo registro
   */
  createRegistro(registro: RegistroForm): Observable<ApiResponse<Registro>> {
    return this.http
      .post<ApiResponse<Registro>>(`${this.baseUrl}/registros`, registro, {
        headers: this.getHeaders(),
      })
      .pipe(timeout(this.timeout), catchError(this.handleError));
  }

  /**
   * Obtener estadísticas de registros
   */
  getEstadisticas(): Observable<ApiResponse<EstadisticasRegistro>> {
    return this.http
      .get<ApiResponse<EstadisticasRegistro>>(
        `${this.baseUrl}/registros/estadisticas`,
        { headers: this.getHeaders() }
      )
      .pipe(
        timeout(this.timeout),
        retry(this.retryAttempts),
        catchError(this.handleError)
      );
  }

  // ==================== SINCRONIZACIÓN ====================

  /**
   * Sincronizar registros offline
   */
  syncRegistros(registros: Registro[]): Observable<SyncResponse> {
    return this.http
      .post<SyncResponse>(
        `${this.baseUrl}/sync/registros`,
        { registros },
        { headers: this.getHeaders() }
      )
      .pipe(
        timeout(this.timeout * 2), // Timeout mayor para sincronización
        catchError(this.handleError)
      );
  }

  /**
   * Verificar conexión con el servidor
   */
  ping(): Observable<ApiResponse<{ timestamp: string }>> {
    return this.http
      .get<ApiResponse<{ timestamp: string }>>(`${this.baseUrl}/ping`, {
        headers: this.getHeaders(),
      })
      .pipe(
        timeout(5000), // 5 segundos
        catchError(this.handleError)
      );
  }
}
