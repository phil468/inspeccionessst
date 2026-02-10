import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonListHeader,
  AlertController,
  ToastController,
  LoadingController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  save,
  close,
  personOutline,
  briefcaseOutline,
  businessOutline,
  calendarOutline,
  mailOutline,
  callOutline,
  locationOutline,
  checkmarkCircle,
  closeCircle,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import {
  Personal,
  Empresa,
  Area,
  Cargo,
  TipoDeTrabajador,
  TipoDePersonal,
  Planilla,
} from '../../models/catalogo.model';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { SupervisorModalComponent } from './supervisor-modal/supervisor-modal.component';

@Component({
  selector: 'app-personal-form',
  templateUrl: './personal-form.page.html',
  styleUrls: ['./personal-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonListHeader,
  ],
})
export class PersonalFormPage implements OnInit {
  personalForm!: FormGroup;
  personalId: number | null = null;
  personal: Personal | null = null;
  isEditMode: boolean = false;
  isViewMode: boolean = false;

  // Catálogos
  empresas: Empresa[] = [];
  areas: Area[] = [];
  cargos: Cargo[] = [];
  tiposDeTrabajador: TipoDeTrabajador[] = [];
  tiposDePersonal: TipoDePersonal[] = [];
  planillas: Planilla[] = [];
  personalList: Personal[] = []; // Para reporta_a

  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private storageService: StorageService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private modalController: ModalController,
  ) {
    addIcons({
      save,
      close,
      personOutline,
      briefcaseOutline,
      businessOutline,
      calendarOutline,
      mailOutline,
      callOutline,
      locationOutline,
      checkmarkCircle,
      closeCircle,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit() {
    this.initForm();
    this.loadCatalogos();
    this.checkMode();
  }

  /**
   * Inicializar formulario
   */
  initForm() {
    this.personalForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombres: ['', Validators.required],
      apellido_paterno: ['', Validators.required],
      apellido_materno: ['', Validators.required],
      empresa_id: [null, Validators.required],
      area_id: [null],
      cargo_id: [null, Validators.required],
      tipo_de_trabajador_id: [null],
      tipo_de_personal_id: [null],
      planilla_id: [null],
      reporta_a: [null],
      email: ['', Validators.email],
      telefono: [''],
      fecha_ingreso: [''],
      fecha_cese: [''],
      cesado: [false],
      seleccionado: [false],
      importado: [false],
      inspector: [false], // Campo para indicar si es inspector
    });

    // Si marca como inspector, hacer obligatorio el email
    this.personalForm
      .get('inspector')
      ?.valueChanges.subscribe((isInspector) => {
        const emailControl = this.personalForm.get('email');
        if (isInspector) {
          emailControl?.setValidators([Validators.required, Validators.email]);
        } else {
          emailControl?.setValidators([Validators.email]);
        }
        emailControl?.updateValueAndValidity();
      });
  }

  /**
   * Verificar modo (nuevo, editar, ver)
   */
  checkMode() {
    const id = this.route.snapshot.paramMap.get('id');
    const detalleId = this.route.snapshot.paramMap.get('detalleId');

    console.log('checkMode - id:', id, 'detalleId:', detalleId);

    if (id === 'nuevo') {
      this.isEditMode = false;
      this.isViewMode = false;
    } else if (detalleId) {
      // Ruta: /personal/detalle/:detalleId (solo lectura)
      this.personalId = Number(detalleId);
      this.isViewMode = true;
      this.isEditMode = false;
      console.log('Modo Ver - Personal ID:', this.personalId);
      this.loadPersonal();
    } else if (id && id !== 'nuevo') {
      // Ruta: /personal/editar/:id (edición)
      this.personalId = Number(id);
      this.isEditMode = true;
      this.isViewMode = false;
      console.log('Modo Editar - Personal ID:', this.personalId);
      this.loadPersonal();
    }
  }

  /**
   * Cargar catálogos
   */
  async loadCatalogos() {
    try {
      const catalogos = await this.storageService.getCatalogos();
      if (catalogos) {
        this.empresas = catalogos.empresas || [];
        this.areas = catalogos.areas || [];
        this.cargos = catalogos.cargos || [];
        this.tiposDeTrabajador = catalogos.tipos_trabajador || [];
        this.tiposDePersonal = catalogos.tipos_personal || [];
        this.planillas = catalogos.planillas || [];
      }

      // Cargar personal para reporta_a (ordenado alfabéticamente)
      const personal = await this.storageService.getActivePersonal();
      this.personalList = personal.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', {
          sensitivity: 'base',
        }),
      );
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  }

  /**
   * Cargar personal existente
   */
  async loadPersonal() {
    if (!this.personalId) return;

    try {
      this.loading = true;
      console.log('loadPersonal - Buscando ID:', this.personalId);

      // Intentar cargar desde IndexedDB primero
      const personalLocal = await this.storageService.getPersonalById(
        this.personalId,
      );

      console.log('Personal desde IndexedDB:', personalLocal);

      if (personalLocal) {
        this.personal = personalLocal;
        console.log('Datos cargados desde IndexedDB:', this.personal);
        this.patchFormValues();

        if (this.isViewMode) {
          this.personalForm.disable();
        }
      } else {
        // Si no está en IndexedDB, intentar desde API
        console.log('No encontrado en IndexedDB, intentando API...');
        try {
          const response = await this.apiService.getPersonalById(
            this.personalId,
          );

          if (response.data) {
            this.personal = response.data;
            console.log('Datos cargados desde API:', this.personal);
            this.patchFormValues();

            if (this.isViewMode) {
              this.personalForm.disable();
            }
          }
        } catch (apiError) {
          console.error('Error cargando desde API:', apiError);
          this.showToast(
            'No se pudo cargar el personal. Verifica tu conexión.',
            'danger',
          );
        }
      }
    } catch (error) {
      console.error('Error cargando personal:', error);
      this.showToast('Error al cargar datos del personal', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Llenar formulario con datos existentes
   */
  patchFormValues() {
    if (!this.personal) return;

    console.log('patchFormValues - Llenando formulario con:', this.personal);

    // Convertir fechas al formato yyyy-MM-dd si es necesario
    const formatDate = (
      dateString: string | null | undefined,
    ): string | null => {
      if (!dateString) return null;
      // Si ya está en formato yyyy-MM-dd, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Si tiene timestamp, extraer solo la fecha
      return dateString.split('T')[0];
    };

    // Usar los campos individuales si existen, de lo contrario extraer del nombre completo
    let nombres = this.personal.nombres || '';
    let apellido_paterno = this.personal.apellido_paterno || '';
    let apellido_materno = this.personal.apellido_materno || '';

    // Si los campos individuales están vacíos pero hay un nombre completo, extraerlos
    if (!nombres && !apellido_paterno && this.personal.name) {
      const nameParts = this.extractNameParts(this.personal.name);
      nombres = nameParts.nombres;
      apellido_paterno = nameParts.apellido_paterno;
      apellido_materno = nameParts.apellido_materno;
    }

    this.personalForm.patchValue({
      dni: this.personal.dni,
      nombres: nombres,
      apellido_paterno: apellido_paterno,
      apellido_materno: apellido_materno,
      empresa_id: this.personal.empresa_id,
      area_id: this.personal.area_id,
      cargo_id: this.personal.cargo_id,
      tipo_de_trabajador_id: this.personal.tipo_de_trabajador_id,
      tipo_de_personal_id: this.personal.tipo_de_personal_id,
      planilla_id: this.personal.planilla_id,
      reporta_a: this.personal.reporta_a,
      email: this.personal.correo_empresa,
      telefono: this.personal.celular_empresa,
      fecha_ingreso: formatDate(this.personal.fecha_ingreso),
      fecha_cese: formatDate(this.personal.fecha_cese),
      cesado: this.personal.cesado,
      seleccionado: this.personal.seleccionado,
      importado: this.personal.importado,
      inspector: !!this.personal.inspector,
    });

    console.log('Formulario después de patchValue:', this.personalForm.value);
  }

  /**
   * Extraer partes del nombre completo
   */
  extractNameParts(fullName: string): {
    apellido_paterno: string;
    apellido_materno: string;
    nombres: string;
  } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) {
      return { apellido_paterno: '', apellido_materno: '', nombres: '' };
    } else if (parts.length === 1) {
      return { apellido_paterno: parts[0], apellido_materno: '', nombres: '' };
    } else if (parts.length === 2) {
      return {
        apellido_paterno: parts[0],
        apellido_materno: parts[1],
        nombres: '',
      };
    } else {
      // Asumimos que los dos primeros son apellidos y el resto son nombres
      return {
        apellido_paterno: parts[0],
        apellido_materno: parts[1],
        nombres: parts.slice(2).join(' '),
      };
    }
  }

  /**
   * Abrir modal para seleccionar supervisor
   */
  async openSupervisorModal() {
    if (this.isViewMode) return;

    const modal = await this.modalController.create({
      component: SupervisorModalComponent,
      componentProps: {
        personalList: this.personalList,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.selected) {
      this.personalForm.patchValue({
        reporta_a: data.selected.id,
      });
      this.showToast(
        `Supervisor seleccionado: ${data.selected.name}`,
        'success',
      );
    }
  }

  /**
   * Obtener nombre del supervisor seleccionado
   */
  getSupervisorNombre(): string {
    const reportaId = this.personalForm.get('reporta_a')?.value;
    if (!reportaId) return 'Seleccione supervisor';
    const supervisor = this.personalList.find((p) => p.id === reportaId);
    return supervisor ? supervisor.name : 'Seleccione supervisor';
  }

  /**
   * Marcar como cesado
   */
  async marcarCesado() {
    if (!this.personalId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Está seguro de marcar este personal como cesado?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Marcando como cesado...',
            });
            await loading.present();

            try {
              await this.apiService.marcarCesado(this.personalId!);
              this.showToast('Personal marcado como cesado', 'success');
              this.router.navigate(['/personal']);
            } catch (error) {
              console.error('Error:', error);
              this.showToast('Error al marcar como cesado', 'danger');
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Reactivar personal cesado
   */
  async reactivarPersonal() {
    if (!this.personalId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar',
      message: '¿Está seguro de reactivar este personal?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Reactivando personal...',
            });
            await loading.present();

            try {
              await this.apiService.reactivarPersonal(this.personalId!);
              this.showToast('Personal reactivado', 'success');
              this.router.navigate(['/personal']);
            } catch (error) {
              console.error('Error:', error);
              this.showToast('Error al reactivar personal', 'danger');
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Guardar personal
   */
  async guardar() {
    if (this.personalForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning',
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode
        ? 'Actualizando personal...'
        : 'Guardando personal...',
    });
    await loading.present();

    try {
      const formData = this.personalForm.value;

      // Concatenar nombre completo
      const nombreCompleto =
        `${formData.apellido_paterno} ${formData.apellido_materno} ${formData.nombres}`.trim();

      // Preparar datos para enviar
      const personalData: any = {
        dni: formData.dni,
        name: nombreCompleto,
        nombres: formData.nombres,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        empresa_id: formData.empresa_id,
        area_id: formData.area_id,
        cargo_id: formData.cargo_id,
        tipo_de_trabajador_id: formData.tipo_de_trabajador_id,
        tipo_de_personal_id: formData.tipo_de_personal_id,
        planilla_id: formData.planilla_id,
        reporta_a: formData.reporta_a,
        correo_empresa: formData.email,
        celular_empresa: formData.telefono,
        fecha_ingreso: formData.fecha_ingreso,
        fecha_cese: formData.fecha_cese,
        cesado: formData.cesado || false,
        seleccionado: formData.seleccionado || false,
        importado: formData.importado || false,
        inspector: formData.inspector || false,
      };

      let response;
      if (this.isEditMode && this.personalId) {
        // Actualizar personal existente
        response = await this.apiService.updatePersonal(
          this.personalId,
          personalData,
        );
        this.showToast('Personal actualizado correctamente', 'success');
      } else {
        // Crear nuevo personal
        response = await this.apiService.createPersonal(personalData);
        this.showToast('Personal creado correctamente', 'success');
      }

      // Actualizar en storage local
      if (response && response.data) {
        await this.storageService.savePersonal([response.data]);
      }

      // Mostrar información sobre acción de usuario (si el backend creó o ajustó usuario)
      if (response && response.usuario_accion) {
        let infoMsg = '';
        switch (response.usuario_accion) {
          case 'usuario_creado':
            infoMsg =
              'Se creó un usuario de sistema para este personal y se le asignó el rol Operador.';
            break;
          case 'rol_actualizado_a_operador':
            infoMsg = 'El usuario existente cambió su rol a Operador.';
            break;
          case 'rol_asignado_operador':
            infoMsg = 'Se asignó el rol Operador al usuario existente.';
            break;
          case 'sin_cambios_por_rol_superior':
            infoMsg =
              'El usuario tiene rol administrador/supervisor: no se realizaron cambios en su rol.';
            break;
          default:
            infoMsg = '';
        }

        if (infoMsg) {
          const alert = await this.alertController.create({
            header: 'Información',
            message: infoMsg,
            buttons: ['Aceptar'],
          });
          await alert.present();
        }
      }

      // Regresar a la lista
      await loading.dismiss();
      this.router.navigate(['/personal']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error guardando personal:', error);

      let errorMsg = 'Error al guardar personal';
      if (error?.error?.message) {
        errorMsg = error.error.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      this.showToast(errorMsg, 'danger');
    }
  }

  /**
   * Cancelar
   */
  cancelar() {
    this.router.navigate(['/personal']);
  }

  /**
   * Mostrar toast
   */
  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
