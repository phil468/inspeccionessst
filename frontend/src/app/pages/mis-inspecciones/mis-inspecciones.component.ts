import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { InspeccionService } from '../../services/inspeccion.service';
import { Inspeccion, ResultadoInspeccion } from '../../models/inspeccion.model';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  documentOutline,
  documentTextOutline,
  chevronForwardOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';
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
  IonCardContent,
  IonChip,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
} from '@ionic/angular/standalone';

interface InspeccionConResultados extends Inspeccion {
  resultados?: ResultadoInspeccion[];
}

@Component({
  selector: 'app-mis-inspecciones',
  templateUrl: './mis-inspecciones.component.html',
  styleUrls: ['./mis-inspecciones.component.scss'],
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
    IonCardContent,
    IonChip,
    IonCol,
    IonGrid,
    IonRow,
    IonText,
  ],
})
export class MisInspeccionesComponent implements OnInit {
  inspecciones: InspeccionConResultados[] = [];
  loading = true;
  currentUser: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private inspeccionService: InspeccionService,
    private navController: NavController
  ) {
    addIcons({
      arrowBackOutline,
      documentOutline,
      documentTextOutline,
      chevronForwardOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
    });
  }

  async ngOnInit() {
    this.currentUser = await this.authService.getCurrentUser();
    await this.cargarInspecciones();
  }

  async cargarInspecciones() {
    this.loading = true;
    try {
      // Aquí implementaremos la lógica para filtrar por rol
      const todasLasInspecciones =
        await this.inspeccionService.getInspecciones();

      // Filtrar según el rol del usuario
      this.inspecciones = this.filtrarInspeccionesPorRol(todasLasInspecciones);
    } catch (error) {
      console.error('Error al cargar inspecciones:', error);
    } finally {
      this.loading = false;
    }
  }

  filtrarInspeccionesPorRol(
    inspecciones: Inspeccion[]
  ): InspeccionConResultados[] {
    if (!this.currentUser) return [];

    const personalId = this.currentUser.personal_id; // Usar personal_id, no user id
    const userRoles = this.currentUser.roles || [];

    console.log('Current User:', this.currentUser);
    console.log('Personal ID del usuario:', personalId);
    console.log(
      'Roles del usuario:',
      userRoles.map((r: any) => r.name)
    );

    // Si es administrador, mostrar todas
    if (userRoles.some((r: any) => r.name === 'Administrador')) {
      console.log('Usuario Administrador - mostrando todas las inspecciones');
      console.log('Total inspecciones:', inspecciones.length);
      return inspecciones;
    }

    // Si no tiene personal_id asignado, no puede ver inspecciones
    if (!personalId) {
      console.warn('El usuario no tiene personal_id asignado');
      return [];
    }

    // Filtrar según los diferentes roles
    return inspecciones.filter((inspeccion: InspeccionConResultados) => {
      // Inspector: ve inspecciones donde está como inspector
      // El backend puede retornar Personal con id o con personal_id
      const esInspector = inspeccion.inspectores?.some(
        (inspector: any) =>
          inspector.id === personalId || inspector.personal_id === personalId
      );

      // Responsable: ve resultados donde está como responsable
      const esResponsable = inspeccion.resultados?.some(
        (resultado: ResultadoInspeccion) =>
          resultado.responsable_id === personalId
      );

      // Visor: ve resultados donde está como visor
      // El backend puede retornar con snake_case o camelCase
      const esVisor = inspeccion.resultados?.some((resultado: any) => {
        const visoresList = resultado.visores || [];
        return visoresList.some(
          (visor: any) =>
            visor.id === personalId ||
            visor.personal_id === personalId ||
            visor.pivot?.personal_id === personalId
        );
      });

      // Responsable de levantamiento: ve resultados donde está como responsable de levantamiento
      // El backend puede retornar con snake_case o camelCase
      const esResponsableLevantamiento = inspeccion.resultados?.some(
        (resultado: any) => {
          const responsablesLev =
            resultado.responsables_levantamiento ||
            resultado.responsablesLevantamiento ||
            [];
          return responsablesLev.some(
            (resp: any) =>
              resp.id === personalId ||
              resp.personal_id === personalId ||
              resp.pivot?.personal_id === personalId
          );
        }
      );

      if (
        esInspector ||
        esResponsable ||
        esVisor ||
        esResponsableLevantamiento
      ) {
        console.log(`Inspección ${inspeccion.id} coincide:`, {
          esInspector,
          esResponsable,
          esVisor,
          esResponsableLevantamiento,
        });
      }

      return (
        esInspector || esResponsable || esVisor || esResponsableLevantamiento
      );
    });
  }

  getConteoEstado(inspeccion: InspeccionConResultados, estado: string): number {
    if (!inspeccion.resultados) return 0;
    return inspeccion.resultados.filter((r) => r.estado === estado).length;
  }

  verDetalle(inspeccion: Inspeccion) {
    this.navController.navigateForward(`/mis-inspecciones/${inspeccion.id}`);
  }

  async doRefresh(event: any) {
    await this.cargarInspecciones();
    event.target.complete();
  }

  goBack() {
    this.navController.back();
  }
}
