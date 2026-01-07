import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ToastController,
  LoadingController,
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonChip,
  IonThumbnail,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAccordionGroup,
  IonAccordion,
  IonSpinner,
  IonNote,
  IonBackButton,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DatabaseService } from '../../../services/database.service';
import { SyncService } from '../../../services/sync.service';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { NetworkService } from '../../../services/network.service';
import { InspeccionService } from '../../../services/inspeccion.service';
import {
  Inspeccion,
  TipoInspeccion,
  ResultadoInspeccion,
  NivelRiesgo,
  EstadoResultado,
  InspeccionArea,
  InspeccionInspector,
} from '../../../models/inspeccion.model';
import { Empresa, Area, Personal } from '../../../models/catalogo.model';
import { v4 as uuidv4 } from 'uuid';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  closeOutline,
  addOutline,
  trashOutline,
  cameraOutline,
  searchOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { AreaSelectionModalComponent } from './area-selection-modal/area-selection-modal.component';
import { InspectorSelectionModalComponent } from './inspector-selection-modal/inspector-selection-modal.component';

@Component({
  selector: 'app-inspeccion-form',
  templateUrl: './inspeccion-form.page.html',
  styleUrls: ['./inspeccion-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonChip,
    IonThumbnail,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonNote,
    IonBackButton,
  ],
})
export class InspeccionFormPage implements OnInit {
  inspeccionForm!: FormGroup;
  empresas: Empresa[] = [];
  areas: Area[] = [];
  areasFiltradas: Area[] = [];
  personalList: Personal[] = [];

  isOnline = false;
  isEditMode = false;
  inspeccionId: string | null = null;
  inspeccionOriginal: Inspeccion | null = null;

  tiposInspeccion: TipoInspeccion[] = ['Planeada', 'No Planeada', 'Otro'];
  nivelesRiesgo: NivelRiesgo[] = ['Alto', 'Medio', 'Bajo'];
  estadosResultado: EstadoResultado[] = [
    'Buena Práctica',
    'Cumplimiento',
    'Pendiente',
    'Ejecutado',
  ];

  // Arrays para gestionar selecciones múltiples
  areasSeleccionadas: Area[] = [];
  inspectoresSeleccionados: Personal[] = [];
  resultados: ResultadoInspeccion[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private syncService: SyncService,
    private apiService: ApiService,
    private authService: AuthService,
    private networkService: NetworkService,
    private inspeccionService: InspeccionService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) {
    addIcons({
      saveOutline,
      closeOutline,
      addOutline,
      trashOutline,
      cameraOutline,
      searchOutline,
      checkmarkCircleOutline,
      chevronForwardOutline,
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.inspeccionId = id;
    }

    this.initForm();
    await this.loadCatalogos();
    this.checkConnectivity();

    if (this.isEditMode && this.inspeccionId) {
      await this.loadInspeccion(this.inspeccionId);
    }
  }

  initForm() {
    // Inicializar con fecha actual solo si NO estamos en modo edición
    const now = this.isEditMode ? undefined : new Date().toISOString();

    this.inspeccionForm = this.fb.group({
      empresa_id: ['', Validators.required],
      tipo_inspeccion: ['Planeada', Validators.required],
      tipo_inspeccion_otro: [''],
      vigencia_desde: [now],
      vigencia_hasta: [now],
      zona_inspeccionada: [''],
      numero_registro: ['', Validators.required],
      fecha_hora_inspeccion: [now],
      comentario: [''],
      objetivo: [''],
      descripcion_causa: [''],
      conclusiones_recomendaciones: [''],
    });

    // Listener para filtrar áreas cuando cambia la empresa
    this.inspeccionForm
      .get('empresa_id')
      ?.valueChanges.subscribe((empresaId) => {
        this.filterAreas(empresaId);
        // Limpiar áreas seleccionadas si cambia la empresa
        this.areasSeleccionadas = this.areasSeleccionadas.filter(
          (area) => area.empresa_id === empresaId
        );
      });

    // Listener para habilitar/deshabilitar campo "otro"
    this.inspeccionForm
      .get('tipo_inspeccion')
      ?.valueChanges.subscribe((tipo) => {
        const otroControl = this.inspeccionForm.get('tipo_inspeccion_otro');
        if (tipo === 'Otro') {
          otroControl?.setValidators([Validators.required]);
        } else {
          otroControl?.clearValidators();
          otroControl?.setValue('');
        }
        otroControl?.updateValueAndValidity();
      });
  }

  async loadCatalogos() {
    const loading = await this.loadingController.create({
      message: 'Cargando datos...',
    });
    await loading.present();

    try {
      this.empresas = await this.databaseService.getEmpresas();
      this.areas = await this.databaseService.getAreas();
      this.personalList = await this.databaseService.personal.toArray();

      // Si está online y no hay datos, descargar del servidor
      if (this.isOnline && this.empresas.length === 0) {
        await this.syncService.downloadCatalogos();
        this.empresas = await this.databaseService.getEmpresas();
        this.areas = await this.databaseService.getAreas();
        this.personalList = await this.databaseService.personal.toArray();
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      await this.showToast('Error al cargar catálogos', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  checkConnectivity() {
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  filterAreas(empresaId: number) {
    if (empresaId) {
      this.areasFiltradas = this.areas.filter(
        (area) => area.empresa_id === empresaId
      );
    } else {
      this.areasFiltradas = [];
    }
  }

  async loadInspeccion(id: string) {
    const loading = await this.loadingController.create({
      message: 'Cargando inspección...',
    });
    await loading.present();

    try {
      const inspecciones = await this.databaseService.getInspecciones();
      const inspeccion = inspecciones.find(
        (i: Inspeccion) => i.id?.toString() === id || i.local_id === id
      );

      if (!inspeccion) {
        await this.showToast('Inspección no encontrada', 'danger');
        this.router.navigate(['/inspecciones']);
        return;
      }

      this.inspeccionOriginal = inspeccion;

      // Filtrar áreas por empresa
      this.filterAreas(inspeccion.empresa_id);

      // Normalizar fechas al formato ISO 8601 sin microsegundos
      const normalizarFecha = (
        fecha: string | undefined
      ): string | undefined => {
        if (!fecha) return undefined;
        try {
          // Convertir a Date y luego a ISO string estándar
          return new Date(fecha).toISOString();
        } catch {
          return undefined;
        }
      };

      // Llenar el formulario con un pequeño delay para que los ion-datetime se actualicen correctamente
      setTimeout(() => {
        this.inspeccionForm.patchValue({
          empresa_id: inspeccion.empresa_id,
          tipo_inspeccion: inspeccion.tipo_inspeccion,
          tipo_inspeccion_otro: inspeccion.tipo_inspeccion_otro,
          vigencia_desde: normalizarFecha(inspeccion.vigencia_desde),
          vigencia_hasta: normalizarFecha(inspeccion.vigencia_hasta),
          zona_inspeccionada: inspeccion.zona_inspeccionada,
          numero_registro: inspeccion.numero_registro,
          fecha_hora_inspeccion: normalizarFecha(
            inspeccion.fecha_hora_inspeccion
          ),
          comentario: inspeccion.comentario,
          objetivo: inspeccion.objetivo,
          descripcion_causa: inspeccion.descripcion_causa,
          conclusiones_recomendaciones: inspeccion.conclusiones_recomendaciones,
        });

        // Forzar actualización de los controles
        this.inspeccionForm.updateValueAndValidity();
      }, 150);

      // Cargar áreas, inspectores y resultados desde IndexedDB
      if (inspeccion.id) {
        // Cargar áreas seleccionadas
        const inspeccionAreas =
          await this.databaseService.getInspeccionAreasByInspeccion(
            inspeccion.id
          );
        this.areasSeleccionadas = [];
        for (const ia of inspeccionAreas) {
          const area = this.areas.find((a) => a.id === ia.area_id);
          if (area) {
            this.areasSeleccionadas.push(area);
          }
        }

        // Cargar inspectores seleccionados
        const inspeccionInspectores =
          await this.databaseService.getInspeccionInspectoresByInspeccion(
            inspeccion.id
          );
        this.inspectoresSeleccionados = [];
        for (const ii of inspeccionInspectores) {
          const personal = this.personalList.find(
            (p) => p.id === ii.personal_id
          );
          if (personal) {
            this.inspectoresSeleccionados.push(personal);
          }
        }

        // Cargar resultados
        this.resultados = await this.databaseService.getResultadosByInspeccion(
          inspeccion.id
        );
      }
    } catch (error) {
      console.error('Error al cargar inspección:', error);
      await this.showToast('Error al cargar inspección', 'danger');
      this.router.navigate(['/inspecciones']);
    } finally {
      await loading.dismiss();
    }
  }

  async guardar() {
    if (this.inspeccionForm.invalid) {
      await this.showToast(
        'Por favor completa todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando inspección...',
    });
    await loading.present();

    try {
      const formData = this.inspeccionForm.value;
      const user = this.authService.currentUserValue;

      // Obtener datos de la empresa seleccionada para snapshot
      const empresa = this.empresas.find((e) => e.id === formData.empresa_id);

      const inspeccionData: Inspeccion = {
        local_id:
          this.isEditMode && this.inspeccionOriginal
            ? this.inspeccionOriginal.local_id
            : uuidv4(),
        user_id: user?.id || 0,
        empresa_id: formData.empresa_id,
        area_id:
          this.areasSeleccionadas.length > 0
            ? this.areasSeleccionadas[0].id
            : null, // Compatibilidad: usar primera área o null
        tipo_inspeccion: formData.tipo_inspeccion,
        tipo_inspeccion_otro: formData.tipo_inspeccion_otro,
        vigencia_desde: formData.vigencia_desde,
        vigencia_hasta: formData.vigencia_hasta,
        // Snapshot de empresa
        razon_social: empresa?.razon_social,
        ruc: empresa?.ruc,
        domicilio: empresa?.domicilio,
        actividad_economica: empresa?.actividad_economica,
        // Datos de inspección
        zona_inspeccionada: formData.zona_inspeccionada,
        numero_registro: formData.numero_registro,
        fecha_hora_inspeccion: formData.fecha_hora_inspeccion,
        comentario: formData.comentario,
        objetivo: formData.objetivo,
        descripcion_causa: formData.descripcion_causa,
        conclusiones_recomendaciones: formData.conclusiones_recomendaciones,
        synced: false,
        created_at:
          this.isEditMode && this.inspeccionOriginal?.created_at
            ? this.inspeccionOriginal.created_at
            : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (this.isEditMode && this.inspeccionOriginal) {
        // Actualizar en IndexedDB
        const inspeccionActualizada = {
          ...this.inspeccionOriginal,
          ...inspeccionData,
        };
        await this.databaseService.updateInspeccion(inspeccionActualizada);

        // Guardar relaciones
        await this.guardarRelaciones(inspeccionActualizada.local_id);

        await this.showToast('Inspección actualizada', 'success');
      } else {
        // Guardar nuevo en IndexedDB
        await this.databaseService.saveInspeccion(inspeccionData);

        // Guardar relaciones
        await this.guardarRelaciones(inspeccionData.local_id);

        await this.showToast('Inspección guardada', 'success');
      }

      // Si está online, intentar sincronizar inmediatamente
      if (this.isOnline) {
        try {
          await this.syncService.syncInspecciones();
          console.log('✅ Inspección sincronizada automáticamente');
        } catch (error) {
          console.warn(
            '⚠️ No se pudo sincronizar automáticamente, se sincronizará más tarde',
            error
          );
        }
      }

      this.router.navigate(['/inspecciones']);
    } catch (error: any) {
      console.error('Error al guardar:', error);
      await this.showToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async guardarRelaciones(inspeccionLocalId: string) {
    // Obtener la inspección guardada para tener su ID de IndexedDB
    const inspeccion = await this.databaseService.inspecciones
      .where('local_id')
      .equals(inspeccionLocalId)
      .first();

    if (!inspeccion || !inspeccion.id) {
      console.error(
        'No se pudo encontrar la inspección para guardar relaciones'
      );
      return;
    }

    const inspeccionIndexedDBId = inspeccion.id;

    // Si estamos en modo edición, limpiar relaciones antiguas
    if (this.isEditMode) {
      await this.databaseService.inspeccion_areas
        .where('inspeccion_id')
        .equals(inspeccionIndexedDBId)
        .delete();

      await this.databaseService.inspeccion_inspectores
        .where('inspeccion_id')
        .equals(inspeccionIndexedDBId)
        .delete();

      await this.databaseService.resultados_inspeccion
        .where('inspeccion_id')
        .equals(inspeccionIndexedDBId)
        .delete();
    }

    // 1. Guardar áreas seleccionadas
    const inspeccionAreas: InspeccionArea[] = this.areasSeleccionadas.map(
      (area) => ({
        local_id: uuidv4(),
        inspeccion_id: inspeccionIndexedDBId,
        area_id: area.id,
        synced: false,
      })
    );
    if (inspeccionAreas.length > 0) {
      await this.databaseService.saveInspeccionAreas(inspeccionAreas);
    }

    // 2. Guardar inspectores seleccionados
    const inspectores: InspeccionInspector[] = this.inspectoresSeleccionados
      .filter((personal) => personal.id !== undefined)
      .map((personal) => ({
        local_id: uuidv4(),
        inspeccion_id: inspeccionIndexedDBId,
        personal_id: personal.id!,
        synced: false,
      }));
    if (inspectores.length > 0) {
      await this.databaseService.saveInspeccionInspectores(inspectores);
    }

    // 3. Guardar resultados/hallazgos
    const resultadosConId = this.resultados.map((r) => ({
      ...r,
      inspeccion_id: inspeccionIndexedDBId,
    }));
    if (resultadosConId.length > 0) {
      await this.databaseService.saveResultadosInspeccion(resultadosConId);
    }
  }

  cancelar() {
    this.router.navigate(['/inspecciones']);
  }

  // ========== GESTIÓN DE ÁREAS MÚLTIPLES (MODAL) ==========
  async openAreaSelectionModal() {
    const modal = await this.modalController.create({
      component: AreaSelectionModalComponent,
      componentProps: {
        areas: this.areasFiltradas,
        areasSeleccionadas: [...this.areasSeleccionadas], // Clonar para no modificar directamente
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.areas) {
      this.areasSeleccionadas = data.areas;
    }
  }

  getAreasSeleccionadasText(): string {
    if (this.areasSeleccionadas.length === 0) {
      return 'Seleccionar Áreas';
    }
    if (this.areasSeleccionadas.length === 1) {
      return this.areasSeleccionadas[0].name;
    }
    return `${this.areasSeleccionadas.length} áreas seleccionadas`;
  }

  getAreasNombresLista(): string {
    return this.areasSeleccionadas.map((a) => a.name).join(', ');
  }

  // ========== GESTIÓN DE INSPECTORES (MODAL) ==========
  async openInspectorSelectionModal() {
    const modal = await this.modalController.create({
      component: InspectorSelectionModalComponent,
      componentProps: {
        personalList: this.personalList,
        inspectoresSeleccionados: [...this.inspectoresSeleccionados], // Clonar
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.inspectores) {
      this.inspectoresSeleccionados = data.inspectores;
    }
  }

  getInspectoresSeleccionadosText(): string {
    if (this.inspectoresSeleccionados.length === 0) {
      return 'Seleccionar Inspectores';
    }
    if (this.inspectoresSeleccionados.length === 1) {
      return this.getNombreCompleto(this.inspectoresSeleccionados[0]);
    }
    return `${this.inspectoresSeleccionados.length} inspectores seleccionados`;
  }

  getInspectoresNombresLista(): string {
    return this.inspectoresSeleccionados
      .map((p) => this.getNombreCompleto(p))
      .join(', ');
  }

  getNombreCompleto(personal: Personal): string {
    return `${personal.nombres || ''} ${personal.apellido_paterno || ''} ${
      personal.apellido_materno || ''
    }`.trim();
  }

  // ========== GESTIÓN DE RESULTADOS/HALLAZGOS ==========
  agregarResultado() {
    const nuevoResultado: ResultadoInspeccion = {
      local_id: uuidv4(),
      inspeccion_id: 0, // Se asignará al guardar
      descripcion: '',
      nivel_riesgo: 'Medio',
      estado: 'Pendiente',
      synced: false,
      responsable_id: undefined,
      responsable: undefined,
      visores: [],
      responsablesLevantamiento: [],
    };

    // Calcular fecha límite automática según nivel de riesgo
    this.calcularFechaLimite(nuevoResultado);

    this.resultados.push(nuevoResultado);
  }

  eliminarResultado(index: number) {
    this.resultados.splice(index, 1);
  }

  async tomarFoto(resultado: ResultadoInspeccion, tipo: 'inicial' | 'final') {
    try {
      // Solicitar permisos y capturar foto
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // Base64 para offline-first
        source: CameraSource.Camera,
        saveToGallery: false,
      });

      // La imagen viene como data URL (data:image/jpeg;base64,...)
      const imageData = image.dataUrl;

      if (!imageData) {
        await this.showToast('No se pudo capturar la imagen', 'danger');
        return;
      }

      // Asignar la imagen al resultado según el tipo
      if (tipo === 'inicial') {
        resultado.registro_fotografico_inicial = imageData;
        await this.showToast('Foto inicial capturada', 'success');
      } else {
        resultado.registro_fotografico_final = imageData;
        await this.showToast('Foto final capturada', 'success');
      }
    } catch (error: any) {
      console.error('Error al capturar foto:', error);

      // Manejar errores específicos
      if (error.message && error.message.includes('User cancelled')) {
        await this.showToast('Captura de foto cancelada', 'warning');
      } else if (error.message && error.message.includes('permission')) {
        await this.showToast('Permiso de cámara denegado', 'danger');
      } else {
        await this.showToast('Error al capturar foto', 'danger');
      }
    }
  }

  getRiesgoColor(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'Alto':
        return 'danger';
      case 'Medio':
        return 'warning';
      case 'Bajo':
        return 'success';
      default:
        return 'medium';
    }
  }

  /**
   * Obtener el plazo máximo según nivel de riesgo
   */
  getPlazoTexto(nivel: NivelRiesgo): string {
    switch (nivel) {
      case 'Alto':
        return '0-48 hrs';
      case 'Medio':
        return '0-7 días';
      case 'Bajo':
        return '0-15 días';
      default:
        return '';
    }
  }

  /**
   * Obtener días de plazo según nivel de riesgo
   */
  getDiasPlazo(nivel: NivelRiesgo): number {
    switch (nivel) {
      case 'Alto':
        return 2; // 48 horas = 2 días
      case 'Medio':
        return 7;
      case 'Bajo':
        return 15;
      default:
        return 7;
    }
  }

  /**
   * Calcular fecha límite automática según nivel de riesgo
   */
  calcularFechaLimite(resultado: ResultadoInspeccion): void {
    // Solo calcular automáticamente si está en Pendiente
    if (resultado.estado === 'Pendiente') {
      const fechaInspeccion = this.inspeccionForm.get(
        'fecha_hora_inspeccion'
      )?.value;
      const fechaBase = fechaInspeccion
        ? new Date(fechaInspeccion)
        : new Date();
      const diasPlazo = this.getDiasPlazo(resultado.nivel_riesgo);

      const fechaLimite = new Date(fechaBase);
      fechaLimite.setDate(fechaLimite.getDate() + diasPlazo);

      resultado.fecha_cierre = fechaLimite.toISOString();
    }
  }

  /**
   * Evento cuando cambia el nivel de riesgo
   */
  onNivelRiesgoChange(resultado: ResultadoInspeccion): void {
    this.calcularFechaLimite(resultado);
  }

  /**
   * Evento cuando cambia el estado
   */
  onEstadoChange(resultado: ResultadoInspeccion): void {
    // Buena Práctica, Cumplimiento y Ejecutado: fecha = fecha de inspección
    if (
      resultado.estado === 'Buena Práctica' ||
      resultado.estado === 'Cumplimiento' ||
      resultado.estado === 'Ejecutado'
    ) {
      const fechaInspeccion = this.inspeccionForm.get(
        'fecha_hora_inspeccion'
      )?.value;
      resultado.fecha_cierre = fechaInspeccion
        ? fechaInspeccion
        : new Date().toISOString();
    } else {
      // Pendiente: recalcular fecha límite según nivel de riesgo
      this.calcularFechaLimite(resultado);
    }
  }

  getEstadoColor(estado: EstadoResultado): string {
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

  getNombrePersonal(personal: Personal | undefined): string {
    if (!personal) return '';
    return `${personal.nombres} ${personal.apellido_paterno || ''} ${
      personal.apellido_materno || ''
    }`.trim();
  }

  async seleccionarResponsable(resultadoIndex: number) {
    if (!this.inspeccionForm.get('empresa_id')?.value) {
      await this.showToast('Primero selecciona una empresa', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: InspectorSelectionModalComponent,
      componentProps: {
        personalList: this.personalList,
        inspectoresSeleccionados: this.resultados[resultadoIndex].responsable
          ? [this.resultados[resultadoIndex].responsable!]
          : [],
        filtrarSoloInspectores: false, // Mostrar todo el personal
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (
      data &&
      data.inspectoresSeleccionados &&
      data.inspectoresSeleccionados.length > 0
    ) {
      this.resultados[resultadoIndex].responsable =
        data.inspectoresSeleccionados[0];
      this.resultados[resultadoIndex].responsable_id =
        data.inspectoresSeleccionados[0].id;
    }
  }

  async seleccionarVisores(resultadoIndex: number) {
    if (!this.inspeccionForm.get('empresa_id')?.value) {
      await this.showToast('Primero selecciona una empresa', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: InspectorSelectionModalComponent,
      componentProps: {
        personalList: this.personalList,
        inspectoresSeleccionados: this.resultados[resultadoIndex].visores || [],
        filtrarSoloInspectores: false, // Mostrar todo el personal
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data && data.inspectoresSeleccionados) {
      this.resultados[resultadoIndex].visores = data.inspectoresSeleccionados;
    }
  }

  async seleccionarResponsablesLevantamiento(resultadoIndex: number) {
    if (!this.inspeccionForm.get('empresa_id')?.value) {
      await this.showToast('Primero selecciona una empresa', 'warning');
      return;
    }

    const modal = await this.modalController.create({
      component: InspectorSelectionModalComponent,
      componentProps: {
        personalList: this.personalList,
        inspectoresSeleccionados:
          this.resultados[resultadoIndex].responsablesLevantamiento || [],
        filtrarSoloInspectores: false, // Mostrar todo el personal
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data && data.inspectoresSeleccionados) {
      this.resultados[resultadoIndex].responsablesLevantamiento =
        data.inspectoresSeleccionados;
    }
  }

  get esInspector(): boolean {
    // Verificar si el usuario actual está en la lista de inspectores seleccionados
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    return this.inspectoresSeleccionados.some(
      (inspector) => inspector.id === currentUser.personal_id
    );
  }

  puedeSubirFotoFinal(resultado: ResultadoInspeccion): boolean {
    // Puede subir foto final si es responsable de levantamiento o inspector
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    const esResponsableLevantamiento =
      resultado.responsablesLevantamiento?.some(
        (resp) => resp.id === currentUser.personal_id
      );

    return this.esInspector || esResponsableLevantamiento || false;
  }

  async aprobarFoto(
    resultado: ResultadoInspeccion,
    tipo: 'inicial' | 'final',
    accion: 'aprobar' | 'rechazar'
  ) {
    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para aprobar fotos',
        'warning'
      );
      return;
    }

    if (!resultado.id) {
      await this.showToast('La inspección debe estar guardada', 'warning');
      return;
    }

    // Pedir comentario opcional
    const alert = await this.loadingController.create({
      message:
        accion === 'aprobar' ? 'Aprobando foto...' : 'Rechazando foto...',
    });
    await alert.present();

    try {
      let response: any;

      if (tipo === 'inicial') {
        response = await this.apiService.post(
          `/resultados/${resultado.id}/foto-inicial/aprobar`,
          { accion, comentario: '' }
        );
      } else {
        response = await this.apiService.post(
          `/resultados/${resultado.id}/foto-final/aprobar`,
          { accion, comentario: '' }
        );
      }

      await alert.dismiss();

      if (response.success) {
        // Actualizar el estado local
        if (tipo === 'inicial') {
          resultado.foto_inicial_estado =
            accion === 'aprobar' ? 'aprobada' : 'rechazada';
        } else {
          resultado.foto_final_estado =
            accion === 'aprobar' ? 'aprobada' : 'rechazada';
        }

        await this.showToast(response.message, 'success');
      } else {
        await this.showToast('Error al procesar la foto', 'danger');
      }
    } catch (error) {
      console.error('Error al aprobar foto:', error);
      await alert.dismiss();
      await this.showToast('Error al procesar la foto', 'danger');
    }
  }

  verFoto(fotoUrl: string) {
    // Abrir modal o ventana para ver la foto en grande
    // Por ahora solo mostramos un toast
    this.showToast('Visualizando foto', 'primary');
  }

  getEstadoFotoColor(estado: string): string {
    switch (estado) {
      case 'aprobada':
        return 'success';
      case 'rechazada':
        return 'danger';
      case 'pendiente':
      default:
        return 'warning';
    }
  }

  getEstadoFotoIcon(estado: string): string {
    switch (estado) {
      case 'aprobada':
        return 'checkmark-circle';
      case 'rechazada':
        return 'close-circle';
      case 'pendiente':
      default:
        return 'time';
    }
  }

  getEstadoFotoText(estado: string): string {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  }

  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
