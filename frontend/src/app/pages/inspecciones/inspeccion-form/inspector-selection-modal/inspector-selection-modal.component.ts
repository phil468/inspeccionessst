import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  ModalController,
  AlertController,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { Personal } from '../../../../models/catalogo.model';
import {
  PersonalService,
  ValidacionPersonalResponse,
  AsegurarAccesoResponse,
} from '../../../../services/personal.service';
import { NetworkService } from '../../../../services/network.service';

@Component({
  selector: 'app-inspector-selection-modal',
  templateUrl: './inspector-selection-modal.component.html',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class InspectorSelectionModalComponent implements OnInit {
  personalList: Personal[] = [];
  inspectoresSeleccionados: Personal[] = [];
  filtrarSoloInspectores: boolean = true;
  validarCorreoUsuario: boolean = true; // Activar validación de correo y usuario
  seleccionUnica: boolean = false; // Modo de selección única (solo un elemento)

  searchTerm = '';
  personalFiltrado: Personal[] = [];
  personalMostrado: Personal[] = [];
  itemsPorPagina = 20;
  isOnline = false;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private personalService: PersonalService,
    private networkService: NetworkService
  ) {}

  ngOnInit() {
    // Verificar conectividad
    this.networkService.isOnline$.subscribe((status) => {
      this.isOnline = status;
    });

    // Filtrar solo personal que sea inspector si está habilitado
    if (this.filtrarSoloInspectores) {
      this.personalList = this.personalList.filter((p) => p.inspector === true);
    }
    this.personalFiltrado = [...this.personalList];
    this.ordenarPorSeleccionados();
    this.cargarMasPersonal();
  }

  filterPersonal() {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.personalFiltrado = [...this.personalList];
    } else {
      this.personalFiltrado = this.personalList.filter(
        (p) =>
          p.nombres.toLowerCase().includes(term) ||
          p.apellido_paterno?.toLowerCase().includes(term) ||
          p.apellido_materno?.toLowerCase().includes(term) ||
          p.dni?.toLowerCase().includes(term)
      );
    }

    // Ordenar para mostrar seleccionados primero
    this.ordenarPorSeleccionados();

    // Reiniciar la lista mostrada
    this.personalMostrado = [];
    this.cargarMasPersonal();
  }

  ordenarPorSeleccionados() {
    this.personalFiltrado.sort((a, b) => {
      const aSeleccionado = this.isInspectorSeleccionado(a.id);
      const bSeleccionado = this.isInspectorSeleccionado(b.id);

      // Primero ordenar por selección
      if (aSeleccionado && !bSeleccionado) return -1;
      if (!aSeleccionado && bSeleccionado) return 1;

      // Si ambos tienen el mismo estado de selección, ordenar alfabéticamente
      const nombreA = this.getNombreCompleto(a).toLowerCase();
      const nombreB = this.getNombreCompleto(b).toLowerCase();
      return nombreA.localeCompare(nombreB);
    });
  }

  cargarMasPersonal() {
    const inicio = this.personalMostrado.length;
    const fin = inicio + this.itemsPorPagina;
    const nuevoPersonal = this.personalFiltrado.slice(inicio, fin);
    this.personalMostrado.push(...nuevoPersonal);
  }

  onIonInfinite(event: any) {
    this.cargarMasPersonal();
    setTimeout(() => {
      event.target.complete();
    }, 300);
  }

  isInspectorSeleccionado(personalId: number | undefined): boolean {
    if (!personalId) return false;
    return this.inspectoresSeleccionados.some((p) => p.id === personalId);
  }

  toggleInspector(personal: Personal) {
    if (!personal.id) return;

    const index = this.inspectoresSeleccionados.findIndex(
      (p) => p.id === personal.id
    );

    if (index > -1) {
      // Si ya está seleccionado, deseleccionar
      this.inspectoresSeleccionados.splice(index, 1);
    } else {
      if (this.seleccionUnica) {
        // En modo selección única, reemplazar la selección
        this.inspectoresSeleccionados = [personal];
      } else {
        // En modo múltiple, agregar a la lista
        this.inspectoresSeleccionados.push(personal);
      }
    }

    // Reordenar para mantener seleccionados al inicio
    this.ordenarPorSeleccionados();
    this.personalMostrado = [];
    this.cargarMasPersonal();
  }

  getNombreCompleto(personal: Personal): string {
    const partes = [
      personal.nombres,
      personal.apellido_paterno,
      personal.apellido_materno,
    ].filter((p) => p);
    return partes.join(' ');
  }

  async confirmar() {
    // Si no hay validación activa o está offline, confirmar directamente
    if (!this.validarCorreoUsuario || !this.isOnline) {
      this.modalController.dismiss({
        inspectores: this.inspectoresSeleccionados,
      });
      return;
    }

    // Validar cada personal seleccionado
    const loading = await this.loadingController.create({
      message: 'Validando acceso al sistema...',
    });
    await loading.present();

    try {
      const personalSinAcceso: Personal[] = [];

      for (const personal of this.inspectoresSeleccionados) {
        if (!personal.id) continue;

        try {
          const validacion = await this.personalService.validarParaNotificacion(
            personal.id
          );

          if (!validacion.data.tiene_correo || !validacion.data.tiene_usuario) {
            personalSinAcceso.push(personal);
          }
        } catch (error) {
          console.error('Error validando personal:', personal.id, error);
          // Si hay error de validación, agregar a la lista para revisión
          personalSinAcceso.push(personal);
        }
      }

      await loading.dismiss();

      if (personalSinAcceso.length > 0) {
        // Mostrar modal para solicitar correo y crear usuario
        await this.solicitarCorreoParaPersonal(personalSinAcceso);
      } else {
        // Todos tienen acceso, confirmar
        this.modalController.dismiss({
          inspectores: this.inspectoresSeleccionados,
        });
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error en validación:', error);
      await this.showToast(
        'Error al validar acceso, se continuará sin validación',
        'warning'
      );
      this.modalController.dismiss({
        inspectores: this.inspectoresSeleccionados,
      });
    }
  }

  async solicitarCorreoParaPersonal(personalSinAcceso: Personal[]) {
    for (const personal of personalSinAcceso) {
      const nombreCompleto = this.getNombreCompleto(personal);

      // Determinar mensaje según si falta correo o usuario
      let mensaje = `"${nombreCompleto}" necesita acceso al sistema para recibir notificaciones.`;
      if (!personal.correo_empresa) {
        mensaje += '\n\nPor favor, ingrese su correo empresarial:';
      } else {
        mensaje += `\n\nCorreo actual: ${personal.correo_empresa}\n\nSe creará un usuario con este correo.`;
      }

      const alert = await this.alertController.create({
        header: 'Configurar Acceso',
        subHeader: nombreCompleto,
        message: mensaje,
        inputs: [
          {
            name: 'correo',
            type: 'email',
            placeholder: 'correo@empresa.com',
            value: personal.correo_empresa || '',
          },
        ],
        buttons: [
          {
            text: 'Omitir',
            role: 'cancel',
            handler: () => {
              // Quitar de la lista de seleccionados
              const index = this.inspectoresSeleccionados.findIndex(
                (p) => p.id === personal.id
              );
              if (index > -1) {
                this.inspectoresSeleccionados.splice(index, 1);
              }
            },
          },
          {
            text: 'Confirmar',
            handler: async (data) => {
              if (!data.correo || !this.validarFormatoCorreo(data.correo)) {
                await this.showToast('Ingrese un correo válido', 'warning');
                return false; // No cerrar el alert
              }

              const resultado = await this.asegurarAccesoPersonal(
                personal,
                data.correo
              );
              if (!resultado) {
                return false; // No cerrar si hay error
              }
              return true;
            },
          },
        ],
        backdropDismiss: false,
      });

      await alert.present();
      await alert.onDidDismiss();
    }

    // Después de procesar todos, confirmar con los que quedaron
    if (this.inspectoresSeleccionados.length > 0) {
      this.modalController.dismiss({
        inspectores: this.inspectoresSeleccionados,
      });
    } else {
      await this.showToast('No se seleccionó ningún personal', 'warning');
    }
  }

  async asegurarAccesoPersonal(
    personal: Personal,
    correo: string
  ): Promise<boolean> {
    const loading = await this.loadingController.create({
      message: 'Configurando acceso...',
    });
    await loading.present();

    try {
      const response = await this.personalService.asegurarAccesoSistema(
        personal.id!,
        correo,
        false
      );

      await loading.dismiss();

      if (response.success) {
        // Actualizar el correo en el objeto local
        personal.correo_empresa = correo;
        await this.showToast(response.message, 'success');
        return true;
      } else {
        await this.showToast(
          response.message || 'Error al configurar acceso',
          'danger'
        );
        return false;
      }
    } catch (error: any) {
      await loading.dismiss();

      // Verificar si es un conflicto de correo
      if (error.status === 409 || error.error?.error_code === 'CORREO_EN_USO') {
        const conflicto = error.error?.data;
        return await this.manejarConflictoCorreo(personal, correo, conflicto);
      }

      console.error('Error asegurando acceso:', error);
      await this.showToast(
        'Error al configurar acceso: ' + (error.message || 'Error desconocido'),
        'danger'
      );
      return false;
    }
  }

  async manejarConflictoCorreo(
    personal: Personal,
    correo: string,
    conflicto: any
  ): Promise<boolean> {
    const nombreNuevo = this.getNombreCompleto(personal);
    const nombreActual =
      conflicto?.usuario_existente?.personal_actual || 'otro personal';

    const alert = await this.alertController.create({
      header: 'Correo ya en uso',
      message: `El correo "${correo}" ya está asignado a "${nombreActual}".\n\n¿Desea reasignar este usuario a "${nombreNuevo}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => false,
        },
        {
          text: 'Usar otro correo',
          handler: async () => {
            // Mostrar nuevo alert para ingresar otro correo
            const nuevoCorreoAlert = await this.alertController.create({
              header: 'Ingresar otro correo',
              inputs: [
                {
                  name: 'correo',
                  type: 'email',
                  placeholder: 'correo@empresa.com',
                },
              ],
              buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: 'Confirmar',
                  handler: async (data) => {
                    if (data.correo && this.validarFormatoCorreo(data.correo)) {
                      return await this.asegurarAccesoPersonal(
                        personal,
                        data.correo
                      );
                    }
                    await this.showToast('Correo inválido', 'warning');
                    return false;
                  },
                },
              ],
            });
            await nuevoCorreoAlert.present();
          },
        },
        {
          text: 'Reasignar usuario',
          handler: async () => {
            // Forzar reasignación
            const loading = await this.loadingController.create({
              message: 'Reasignando usuario...',
            });
            await loading.present();

            try {
              const response = await this.personalService.asegurarAccesoSistema(
                personal.id!,
                correo,
                true // Forzar reasignación
              );

              await loading.dismiss();

              if (response.success) {
                personal.correo_empresa = correo;
                await this.showToast(
                  'Usuario reasignado exitosamente',
                  'success'
                );
                return true;
              } else {
                await this.showToast(
                  response.message || 'Error al reasignar',
                  'danger'
                );
                return false;
              }
            } catch (err: any) {
              await loading.dismiss();
              await this.showToast('Error al reasignar usuario', 'danger');
              return false;
            }
          },
        },
      ],
      backdropDismiss: false,
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    return result.role !== 'cancel';
  }

  validarFormatoCorreo(correo: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  }

  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
