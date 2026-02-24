import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  LoadingController,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, closeOutline } from 'ionicons/icons';
import { ApiService } from '../../services/api.service';
import { NetworkService } from '../../services/network.service';
import { DatabaseService } from '../../services/database.service';
import {
  Cargo,
  TipoDePuesto,
  NivelJerarquico,
} from '../../models/catalogo.model';

@Component({
  selector: 'app-cargos-form',
  templateUrl: './cargos-form.page.html',
  styleUrls: ['./cargos-form.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class CargosFormPage implements OnInit {
  cargoForm!: FormGroup;
  isEditMode = false;
  cargoId?: number;
  isOnline = false;

  tiposDePuesto: TipoDePuesto[] = [];
  cargos: Cargo[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private networkService: NetworkService,
    private databaseService: DatabaseService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
  ) {
    addIcons({
      saveOutline,
      closeOutline,
    });
  }

  async ngOnInit() {
    this.initForm();
    await this.checkConnectivity();
    await this.loadCatalogos();
    await this.checkMode();
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
    });
  }

  initForm() {
    this.cargoForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      tipo_de_puesto_id: [null],
      reporta_a: [null],
      estado: [true, Validators.required],
    });
  }

  async loadCatalogos() {
    try {
      // Cargar tipos de puesto desde IndexedDB o API
      this.tiposDePuesto =
        (await this.databaseService.tiposDePuesto?.toArray()) || [];

      // Cargar lista de cargos para "Reporta a"
      const cargosList = await this.databaseService.cargos.toArray();
      this.cargos = cargosList.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', {
          sensitivity: 'base',
        }),
      );
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  }

  async checkMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.cargoId = parseInt(id, 10);
      await this.loadCargo();
    }
  }

  async loadCargo() {
    if (!this.cargoId) return;

    const loading = await this.loadingController.create({
      message: 'Cargando cargo...',
    });
    await loading.present();

    try {
      // Intentar cargar desde IndexedDB primero
      const cargo = await this.databaseService.cargos.get(this.cargoId);

      if (cargo) {
        this.patchFormValues(cargo);
      } else if (this.isOnline) {
        // Si no está en IndexedDB y estamos online, cargar desde API
        const response = await this.apiService.get(`/cargos/${this.cargoId}`);
        this.patchFormValues(response);
      } else {
        await this.showToast('No se encontró el cargo', 'danger');
        this.router.navigate(['/cargos']);
      }
    } catch (error: any) {
      console.error('Error al cargar cargo:', error);
      await this.showToast('Error al cargar cargo: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  patchFormValues(cargo: Cargo) {
    this.cargoForm.patchValue({
      name: cargo.name,
      tipo_de_puesto_id: cargo.tipo_de_puesto_id || null,
      reporta_a: cargo.reporta_a || null,
      estado: cargo.estado ? true : false,
    });
  }

  async onSubmit() {
    if (this.cargoForm.invalid) {
      await this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning',
      );
      return;
    }

    if (!this.isOnline) {
      await this.showToast(
        'Debes estar conectado para guardar cambios',
        'warning',
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando cargo...' : 'Creando cargo...',
    });
    await loading.present();

    try {
      const formData = {
        ...this.cargoForm.value,
        estado: this.cargoForm.value.estado ? 1 : 0,
      };

      if (this.isEditMode && this.cargoId) {
        await this.apiService.put(`/cargos/${this.cargoId}`, formData);
        await this.showToast('Cargo actualizado exitosamente', 'success');
      } else {
        await this.apiService.post('/cargos', formData);
        await this.showToast('Cargo creado exitosamente', 'success');
      }

      // Actualizar IndexedDB
      await this.syncCargos();

      this.router.navigate(['/cargos']);
    } catch (error: any) {
      console.error('Error al guardar cargo:', error);
      await this.showToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async syncCargos() {
    try {
      const response = await this.apiService.get('/sync/catalogos');
      if (response.cargos) {
        await this.databaseService.cargos.clear();
        await this.databaseService.cargos.bulkAdd(response.cargos);
      }
    } catch (error) {
      console.error('Error al sincronizar cargos:', error);
    }
  }

  async cancelar() {
    if (this.cargoForm.dirty) {
      const alert = await this.alertController.create({
        header: 'Confirmar',
        message: '¿Desea descartar los cambios?',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
          },
          {
            text: 'Sí',
            handler: () => {
              this.router.navigate(['/cargos']);
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.router.navigate(['/cargos']);
    }
  }

  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
