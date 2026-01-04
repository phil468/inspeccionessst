import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DatabaseService } from './database.service';
import { Inspeccion } from '../models/inspeccion.model';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InspeccionService {
  private apiUrl = `${environment.apiUrl}/inspecciones`;

  constructor(
    private http: HttpClient,
    private databaseService: DatabaseService
  ) {}

  /**
   * Obtener todas las inspecciones (offline-first)
   */
  async getInspecciones(): Promise<Inspeccion[]> {
    return await this.databaseService.getInspecciones();
  }

  /**
   * Obtener inspección por ID
   */
  async getInspeccionById(id: number): Promise<Inspeccion | undefined> {
    return await this.databaseService.inspecciones.get(id);
  }

  /**
   * Enviar notificaciones de una inspección
   */
  async enviarNotificaciones(inspeccionId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/${inspeccionId}/notificar`, {})
      );
      return response;
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      throw error;
    }
  }

  /**
   * Enviar notificaciones masivas
   */
  async enviarNotificacionesMasivas(inspeccionIds: number[]): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/notificaciones/masivas`, {
          inspeccion_ids: inspeccionIds,
        })
      );
      return response;
    } catch (error) {
      console.error('Error al enviar notificaciones masivas:', error);
      throw error;
    }
  }

  /**
   * Aprobar o rechazar foto inicial
   */
  async aprobarFotoInicial(
    resultadoId: number,
    accion: 'aprobar' | 'rechazar',
    comentario?: string
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/resultados/${resultadoId}/foto-inicial/aprobar`,
          { accion, comentario }
        )
      );
      return response;
    } catch (error) {
      console.error('Error al aprobar foto inicial:', error);
      throw error;
    }
  }

  /**
   * Aprobar o rechazar foto final
   */
  async aprobarFotoFinal(
    resultadoId: number,
    accion: 'aprobar' | 'rechazar',
    comentario?: string
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/resultados/${resultadoId}/foto-final/aprobar`,
          { accion, comentario }
        )
      );
      return response;
    } catch (error) {
      console.error('Error al aprobar foto final:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de aprobaciones
   */
  async obtenerHistorialAprobaciones(resultadoId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `${environment.apiUrl}/resultados/${resultadoId}/aprobaciones`
        )
      );
      return response;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }
}
