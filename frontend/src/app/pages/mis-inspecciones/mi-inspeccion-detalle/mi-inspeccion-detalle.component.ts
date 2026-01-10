import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  NavController,
  AlertController,
  LoadingController,
  ActionSheetController,
  ModalController,
} from '@ionic/angular/standalone';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonChip,
  IonListHeader,
  IonRow,
  IonCol,
  IonBadge,
  IonText,
  IonGrid,
} from '@ionic/angular/standalone';
import { AuthService } from '../../../services/auth.service';
import { InspeccionService } from '../../../services/inspeccion.service';
import { ApiService } from '../../../services/api.service';
import { SyncService } from '../../../services/sync.service';
import {
  Inspeccion,
  ResultadoInspeccion,
} from '../../../models/inspeccion.model';
import { environment } from '../../../../environments/environment';
import { FotoViewerModalComponent } from '../../../components/foto-viewer-modal/foto-viewer-modal.component';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  eyeOutline,
  cloudUploadOutline,
  refreshOutline,
  checkmarkOutline,
  closeOutline,
  imageOutline,
  warningOutline,
  thumbsUpOutline,
  thumbsDownOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface ResultadoConRol extends ResultadoInspeccion {
  miRol: 'responsable_levantamiento' | 'visor' | 'inspector' | null;
  puedeSubirFoto: boolean;
  puedeValidar: boolean;
}

@Component({
  selector: 'app-mi-inspeccion-detalle',
  templateUrl: './mi-inspeccion-detalle.component.html',
  styleUrls: ['./mi-inspeccion-detalle.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonChip,
    IonListHeader,
    IonRow,
    IonCol,
    IonBadge,
    IonText,
    IonGrid,
  ],
})
export class MiInspeccionDetalleComponent implements OnInit {
  inspeccion: Inspeccion | null = null;
  resultados: ResultadoConRol[] = [];
  loading = true;
  currentUser: any;
  esInspector = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navController: NavController,
    private authService: AuthService,
    private inspeccionService: InspeccionService,
    private apiService: ApiService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef,
    private syncService: SyncService
  ) {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      eyeOutline,
      cloudUploadOutline,
      refreshOutline,
      checkmarkOutline,
      closeOutline,
      imageOutline,
      warningOutline,
      thumbsUpOutline,
      thumbsDownOutline,
    });
  }

  async ngOnInit() {
    this.currentUser = await this.authService.getCurrentUser();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.cargarInspeccion(parseInt(id));
    }
  }

  async cargarInspeccion(id: number) {
    this.loading = true;
    try {
      // Cargar desde el servidor para obtener datos frescos con todas las relaciones
      this.inspeccion =
        (await this.inspeccionService.getInspeccionByIdFromServer(id)) || null;
      if (this.inspeccion) {
        this.verificarRolInspector();
        this.procesarResultados();
      }
    } catch (error) {
      console.error('Error al cargar inspección:', error);
    } finally {
      this.loading = false;
    }
  }

  verificarRolInspector() {
    if (!this.inspeccion || !this.currentUser) return;

    // console.log('Verificando rol de inspector para la inspección...');
    // console.log('Inspectores de la inspección:', this.inspeccion.inspectores);
    // console.log(
    //   'Personal ID del usuario actual:',
    //   this.currentUser.personal_id
    // );

    const personalId = this.currentUser.personal_id;
    this.esInspector =
      this.inspeccion.inspectores?.some((i: any) => i.id === personalId) ||
      false;
  }

  procesarResultados() {
    if (!this.inspeccion?.resultados || !this.currentUser) {
      this.resultados = [];
      return;
    }

    const personalId = this.currentUser.personal_id;

    // console.log('Procesando resultados para personal ID:', personalId);
    // console.log('Resultados originales:', this.inspeccion.resultados);

    this.resultados = this.inspeccion.resultados.map((resultado) => {
      // Determinar el rol del usuario en este resultado
      // Puede subir foto si es responsable_id O está en responsablesLevantamiento
      const esResponsableDirecto = resultado.responsable_id === personalId;

      // El backend puede retornar con snake_case o camelCase
      const responsablesLev =
        (resultado as any).responsables_levantamiento ||
        resultado.responsablesLevantamiento ||
        [];
      const esResponsableLevantamientoPivot = responsablesLev.some(
        (r: any) =>
          r.id === personalId ||
          r.personal_id === personalId ||
          r.pivot?.personal_id === personalId
      );
      const esResponsableLevantamiento =
        esResponsableDirecto || esResponsableLevantamientoPivot;

      // El backend puede retornar con snake_case o camelCase
      const visoresList = (resultado as any).visores || [];
      const esVisor = visoresList.some(
        (v: any) =>
          v.id === personalId ||
          v.personal_id === personalId ||
          v.pivot?.personal_id === personalId
      );

      let miRol: ResultadoConRol['miRol'] = null;
      if (this.esInspector) {
        miRol = 'inspector';
      } else if (esResponsableLevantamiento) {
        miRol = 'responsable_levantamiento';
      } else if (esVisor) {
        miRol = 'visor';
      }

      // Determinar si puede subir foto:
      // - Es responsable de levantamiento (responsable_id O responsablesLevantamiento)
      // - Y el resultado está en estado Pendiente
      // - Y NO hay foto subida O la foto fue rechazada
      const noHayFotoOFueRechazada =
        !resultado.registro_fotografico_final ||
        resultado.foto_final_estado === 'rechazada';

    //   console.log('Resultado ID:', resultado.id);
    //   console.log(
    //     'Es responsable directo (responsable_id):',
    //     esResponsableDirecto
    //   );
    //   console.log(
    //     'Es responsable levantamiento (pivot):',
    //     esResponsableLevantamientoPivot
    //   );
    //   console.log(
    //     'Es responsable de levantamiento (combinado):',
    //     esResponsableLevantamiento
    //   );
    //   console.log('Estado del resultado:', resultado.estado);
    //   console.log(
    //     'Registro fotográfico final:',
    //     resultado.registro_fotografico_final
    //   );
    //   console.log('Estado de la foto final:', resultado.foto_final_estado);
    //   console.log('No hay foto o fue rechazada:', noHayFotoOFueRechazada);

      const puedeSubirFoto: boolean =
        esResponsableLevantamiento &&
        resultado.estado === 'Pendiente' &&
        noHayFotoOFueRechazada;

    //   console.log('Puede subir foto:', puedeSubirFoto);

    //   console.log('Mi rol en este resultado:', miRol);
    //   console.log('Es inspector:', this.esInspector);
    //   console.log(
    //     'Puede validar:',
    //     this.esInspector &&
    //       !!resultado.registro_fotografico_final &&
    //       resultado.foto_final_estado === 'pendiente'
    //   );

      // Determinar si puede validar (inspector y HAY foto Y está pendiente de revisión)
      const puedeValidar: boolean =
        this.esInspector &&
        !!resultado.registro_fotografico_final &&
        resultado.foto_final_estado === 'pendiente';

      return {
        ...resultado,
        miRol,
        puedeSubirFoto,
        puedeValidar,
      } as ResultadoConRol;
    });

    // Filtrar solo los resultados donde el usuario tiene algún rol
    // (excepto si es administrador o inspector, que ve todos)
    const userRoles = this.currentUser.roles || [];
    const esAdmin = userRoles.some((r: any) => r.name === 'Administrador');

    if (!esAdmin && !this.esInspector) {
      this.resultados = this.resultados.filter((r) => r.miRol !== null);
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Buena Práctica':
        return 'success';
      case 'Cumplimiento':
        return 'primary';
      case 'Pendiente':
        return 'warning';
      case 'Ejecutado':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  getFotoEstadoColor(estado?: string): string {
    switch (estado) {
      case 'aprobada':
        return 'success';
      case 'rechazada':
        return 'danger';
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getFotoEstadoTexto(estado?: string): string {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'pendiente':
        return 'En Revisión';
      default:
        return 'Sin foto';
    }
  }

  getRolTexto(rol: string | null): string {
    switch (rol) {
      case 'responsable_levantamiento':
        return 'Responsable de Levantamiento';
      case 'visor':
        return 'Visor';
      case 'inspector':
        return 'Inspector';
      default:
        return '';
    }
  }

  getRolColor(rol: string | null): string {
    switch (rol) {
      case 'responsable_levantamiento':
        return 'primary';
      case 'visor':
        return 'secondary';
      case 'inspector':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  async subirFoto(resultado: ResultadoConRol) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar origen de la foto',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera-outline',
          handler: () => {
            this.tomarFoto(resultado, CameraSource.Camera);
          },
        },
        {
          text: 'Galería',
          icon: 'image-outline',
          handler: () => {
            this.tomarFoto(resultado, CameraSource.Photos);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async tomarFoto(resultado: ResultadoConRol, source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
      });

      if (image.base64String) {
        await this.enviarFotoFinal(resultado, image.base64String);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }

  async enviarFotoFinal(resultado: ResultadoConRol, base64: string) {
    const loading = await this.loadingController.create({
      message: 'Subiendo foto...',
    });
    await loading.present();

    try {
      const response = await this.apiService.post(
        `/resultados/${resultado.id}/foto-final`,
        {
          foto: `data:image/jpeg;base64,${base64}`,
        }
      );

      if (response && response.success) {
        // Actualizar el resultado localmente
        resultado.registro_fotografico_final =
          response.data?.registro_fotografico_final;
        resultado.foto_final_estado = 'pendiente';
        resultado.puedeSubirFoto = false;

        // Sincronizar la inspección a IndexedDB para que otros componentes vean los cambios
        if (this.inspeccion?.id) {
          await this.syncService.syncInspeccionFromServer(this.inspeccion.id);
        }

        // Recargar la inspección ANTES de mostrar la alerta
        if (this.inspeccion?.id) {
          await this.cargarInspeccion(this.inspeccion.id);
        }

        // Forzar detección de cambios
        this.cdr.detectChanges();

        await this.mostrarAlerta(
          'Éxito',
          'La foto ha sido subida y está pendiente de revisión por el inspector.'
        );
      }
    } catch (error: any) {
      console.error('Error al subir foto:', error);
      await this.mostrarAlerta(
        'Error',
        error.message || 'No se pudo subir la foto'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async validarFoto(resultado: ResultadoConRol, aprobado: boolean) {
    const alert = await this.alertController.create({
      header: aprobado ? 'Aprobar Levantamiento' : 'Rechazar Levantamiento',
      message: aprobado
        ? '¿Confirma que el levantamiento del resultado es correcto?'
        : 'Por favor, indique el motivo del rechazo:',
      inputs: aprobado
        ? []
        : [
            {
              name: 'comentario',
              type: 'textarea',
              placeholder: 'Motivo del rechazo...',
            },
          ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async (data) => {
            await this.procesarValidacion(
              resultado,
              aprobado,
              data?.comentario
            );
          },
        },
      ],
    });
    await alert.present();
  }

  async procesarValidacion(
    resultado: ResultadoConRol,
    aprobado: boolean,
    comentario?: string
  ) {
    const loading = await this.loadingController.create({
      message: 'Procesando validación...',
    });
    await loading.present();

    try {
      const response = await this.apiService.post(
        `/resultados/${resultado.id}/foto-final/validar`,
        {
          accion: aprobado ? 'aprobar' : 'rechazar',
          comentario: comentario || '',
        }
      );

      if (response && response.success) {
        const mensaje = aprobado
          ? 'El levantamiento ha sido aprobado. El resultado pasa a estado Ejecutado.'
          : 'El levantamiento ha sido rechazado. El responsable deberá subir una nueva foto.';

        // Sincronizar la inspección a IndexedDB para que otros componentes vean los cambios
        if (this.inspeccion?.id) {
          await this.syncService.syncInspeccionFromServer(this.inspeccion.id);
        }

        // Recargar la inspección
        if (this.inspeccion?.id) {
          await this.cargarInspeccion(this.inspeccion.id);
        }

        // Forzar detección de cambios
        this.cdr.detectChanges();

        await this.mostrarAlerta('Éxito', mensaje);
      }
    } catch (error: any) {
      console.error('Error al validar:', error);
      await this.mostrarAlerta(
        'Error',
        error.message || 'No se pudo procesar la validación'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async verFoto(url: string, titulo: string = 'Foto') {
    if (!url) return;

    const modal = await this.modalController.create({
      component: FotoViewerModalComponent,
      componentProps: {
        fotoUrl: url,
        titulo: titulo,
      },
      cssClass: 'foto-viewer-modal',
    });
    await modal.present();
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    // Si ya es una URL completa
    if (path.startsWith('http')) return path;
    // Si es una imagen base64, devolverla tal cual
    if (path.startsWith('data:image/')) return path;
    // Si parece ser base64 sin prefijo (string largo sin extensión de archivo)
    if (path.length > 1000 && !path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return `data:image/jpeg;base64,${path}`;
    }
    // Si es una ruta de archivo, construir la URL del backend
    return `${environment.apiUrl.replace('/api/v1', '')}/storage/${path}`;
  }

  async doRefresh(event: any) {
    if (this.inspeccion?.id) {
      await this.cargarInspeccion(this.inspeccion.id);
    }
    event.target.complete();
  }

  goBack() {
    this.navController.back();
  }
}
