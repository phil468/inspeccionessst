import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { InspeccionService } from '../../services/inspeccion.service';
import { Inspeccion, ResultadoInspeccion } from '../../models/inspeccion.model';
import { Personal } from '../../models/catalogo.model';

interface InspeccionConResultados extends Inspeccion {
  resultados?: ResultadoInspeccion[];
}

@Component({
  selector: 'app-mis-inspecciones',
  templateUrl: './mis-inspecciones.component.html',
  styleUrls: ['./mis-inspecciones.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule],
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
  ) {}

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

    const userId = this.currentUser.id;
    const userRoles = this.currentUser.roles || [];

    // Si es administrador, mostrar todas
    if (userRoles.includes('Administrador')) {
      return inspecciones;
    }

    // Filtrar según los diferentes roles
    return inspecciones.filter((inspeccion: InspeccionConResultados) => {
      // Inspector: ve inspecciones donde está como inspector
      const esInspector = inspeccion.inspectores?.some(
        (inspector) => inspector.personal_id === userId
      );

      // Responsable: ve resultados donde está como responsable
      const esResponsable = inspeccion.resultados?.some(
        (resultado: ResultadoInspeccion) => resultado.responsable_id === userId
      );

      // Visor: ve resultados donde está como visor
      const esVisor = inspeccion.resultados?.some(
        (resultado: ResultadoInspeccion) =>
          resultado.visores?.some((visor) => visor.personal_id === userId)
      );

      // Responsable de levantamiento: ve resultados donde está como responsable de levantamiento
      const esResponsableLevantamiento = inspeccion.resultados?.some(
        (resultado: ResultadoInspeccion) =>
          resultado.responsablesLevantamiento?.some(
            (resp) => resp.personal_id === userId
          )
      );

      return (
        esInspector || esResponsable || esVisor || esResponsableLevantamiento
      );
    });
  }

  verDetalle(inspeccion: Inspeccion) {
    this.navController.navigateForward(
      `/tabs/inspecciones/form/${inspeccion.id}`
    );
  }

  async doRefresh(event: any) {
    await this.cargarInspecciones();
    event.target.complete();
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
