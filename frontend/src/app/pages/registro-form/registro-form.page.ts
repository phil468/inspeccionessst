import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonicModule,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NetworkService } from '../../services/network.service';
import { v4 as uuidv4 } from 'uuid';
import { addIcons } from 'ionicons';
import { arrowBackOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-registro-form',
  templateUrl: './registro-form.page.html',
  styleUrls: ['./registro-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class RegistroFormPage implements OnInit {
  registroForm!: FormGroup;
  campanias: any[] = [];
  fundos: any[] = [];
  isOnline = false;
  isEditMode = false;
  registroId: string | null = null;
  registroOriginal: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private syncService: SyncService,
    private apiService: ApiService,
    private authService: AuthService,
    private networkService: NetworkService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ arrowBackOutline, saveOutline });
  }

  async ngOnInit() {
    // Detectar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.registroId = id;
    }

    this.initForm();
    await this.loadCatalogos();
    this.checkConnectivity();

    // Cargar registro si es modo edición
    if (this.isEditMode && this.registroId) {
      await this.loadRegistro(this.registroId);
    }
  }

  initForm() {
    this.registroForm = this.fb.group({
      campania_id: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(0)]],
      numero_tractor: ['', Validators.required],
      fundo_id: ['', Validators.required],
      observaciones: [''],
    });
  }

  async loadCatalogos() {
    const loading = await this.loadingController.create({
      message: 'Cargando catálogos...',
    });
    await loading.present();

    try {
      // Cargar catálogos desde IndexedDB
      this.campanias = await this.databaseService.getCampanias();
      console.log('Campanias cargadas:', this.campanias);
      this.fundos = await this.databaseService.getFundos();

      // Si está online y no hay datos, descargar del servidor
      console.log(
        'Campanias antes de verificar descarga:',
        this.campanias,
        this.isOnline,
        this.campanias.length
      );
      if (this.isOnline && this.campanias.length === 0) {
        console.log('Descargando catálogos del servidor...');
        await this.syncService.downloadCatalogos();
        // Recargar después de la descarga
        this.campanias = await this.databaseService.getCampanias();
        this.fundos = await this.databaseService.getFundos();
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      this.showToast('Error al cargar catálogos', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  checkConnectivity() {
    // Suscribirse a cambios de red
    this.networkService.isOnline$.subscribe((status) => {
      this.isOnline = status;
      console.log('Estado de red en RegistroForm:', status);
    });
  }

  async loadRegistro(id: string) {
    const loading = await this.loadingController.create({
      message: 'Cargando registro...',
    });
    await loading.present();

    try {
      // Cargar desde IndexedDB
      const registros = await this.databaseService.getRegistros();
      const registro = registros.find(
        (r: any) => r.id === parseInt(id) || r.local_id === id
      );

      if (!registro) {
        this.showToast('Registro no encontrado', 'danger');
        this.router.navigate(['/registro-lista']);
        return;
      }

      this.registroOriginal = registro;

      // Llenar el formulario
      this.registroForm.patchValue({
        campania_id: registro.campania_id,
        cantidad: registro.cantidad,
        numero_tractor: registro.numero_tractor,
        fundo_id: registro.fundo_id,
        observaciones: registro.observaciones,
      });
    } catch (error) {
      console.error('Error al cargar registro:', error);
      this.showToast('Error al cargar registro', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.registroForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode
        ? 'Actualizando registro...'
        : 'Guardando registro...',
    });
    await loading.present();

    try {
      const currentUser = await this.authService.getCurrentUser();

      if (this.isEditMode && this.registroOriginal) {
        // MODO EDICIÓN - Actualizar registro existente
        const registroActualizado = {
          ...this.registroOriginal,
          ...this.registroForm.value,
          updated_at: new Date().toISOString(), // Timestamp de modificación
          synced: false, // Marcar como no sincronizado para que se envíe al servidor
        };

        // Actualizar en IndexedDB
        await this.databaseService.updateRegistro(registroActualizado);

        // Si está online, intentar sincronizar inmediatamente
        if (this.isOnline) {
          try {
            await this.syncService.syncRegistros();
            this.showToast('Registro actualizado y sincronizado', 'success');
          } catch (error) {
            this.showToast(
              'Registro actualizado, se sincronizará cuando haya conexión',
              'warning'
            );
          }
        } else {
          this.showToast('Registro actualizado localmente', 'success');
        }
      } else {
        // MODO CREACIÓN - Nuevo registro
        const registro = {
          local_id: uuidv4(),
          ...this.registroForm.value,
          user_id: currentUser?.id,
          fecha_registro: new Date().toISOString(),
          synced: false,
        };

        // Guardar en IndexedDB
        await this.databaseService.saveRegistro(registro);

        // Si está online, intentar sincronizar inmediatamente
        if (this.isOnline) {
          try {
            await this.syncService.syncRegistros();
            this.showToast('Registro guardado y sincronizado', 'success');
          } catch (error) {
            this.showToast(
              'Registro guardado, se sincronizará cuando haya conexión',
              'warning'
            );
          }
        } else {
          this.showToast('Registro guardado localmente', 'success');
        }
      }

      this.registroForm.reset();
      this.router.navigate(['/registro-lista']);
    } catch (error) {
      console.error('Error al guardar registro:', error);
      this.showToast(
        this.isEditMode
          ? 'Error al actualizar registro'
          : 'Error al guardar registro',
        'danger'
      );
    } finally {
      await loading.dismiss();
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/registro-lista']);
  }
}
