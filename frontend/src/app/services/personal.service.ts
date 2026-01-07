import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Personal } from '../models/catalogo.model';

export interface ValidacionPersonalResponse {
  success: boolean;
  data: {
    personal_id: number;
    nombre_completo: string;
    correo_empresa: string | null;
    tiene_correo: boolean;
    tiene_usuario: boolean;
    usuario: {
      id: number;
      name: string;
      email: string;
      activo: boolean;
    } | null;
  };
}

export interface AsegurarAccesoResponse {
  success: boolean;
  message: string;
  error_code?: string;
  data: {
    personal?: Personal;
    usuario?: any;
    accion?:
      | 'ya_vinculado'
      | 'reasignado'
      | 'correo_actualizado'
      | 'usuario_creado';
    usuario_existente?: {
      id: number;
      name: string;
      email: string;
      personal_actual: string;
      personal_actual_id: number | null;
    };
    personal_nuevo?: {
      id: number;
      name: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  constructor(private apiService: ApiService) {}

  /**
   * Validar si un personal tiene correo y usuario
   */
  async validarParaNotificacion(
    personalId: number
  ): Promise<ValidacionPersonalResponse> {
    return this.apiService.get<ValidacionPersonalResponse>(
      `/personal/${personalId}/validar-notificacion`
    );
  }

  /**
   * Asegurar que el personal tenga acceso al sistema (correo y usuario)
   */
  async asegurarAccesoSistema(
    personalId: number,
    correoEmpresa: string,
    forzarReasignacion: boolean = false
  ): Promise<AsegurarAccesoResponse> {
    return this.apiService.post<AsegurarAccesoResponse>(
      `/personal/${personalId}/asegurar-acceso`,
      {
        correo_empresa: correoEmpresa,
        forzar_reasignacion: forzarReasignacion,
      }
    );
  }
}
