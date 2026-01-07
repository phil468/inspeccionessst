import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonicModule,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { NetworkService } from '../../../services/network.service';
import { Area, Empresa } from '../../../models/catalogo.model';
import { addIcons } from 'ionicons';
import { saveOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-areas-form',
  templateUrl: './areas-form.page.html',
  styleUrls: ['./areas-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class AreasFormPage implements OnInit {
  areaForm: FormGroup;
  areaId?: number;
  isEditMode = false;
  isOnline = false;
  empresas: Empresa[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private networkService: NetworkService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ saveOutline, closeOutline });

    this.areaForm = this.formBuilder.group({
      empresa_id: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(250)]],
      centro_costo: ['', Validators.maxLength(250)],
      activo: [true],
    });
  }

  async ngOnInit() {
    this.checkConnectivity();
    await this.loadEmpresas();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.areaId = parseInt(id, 10);
      this.isEditMode = true;
      await this.loadArea();
    }
  }

  async checkConnectivity() {
    this.isOnline = await this.networkService.getCurrentStatus();
    this.networkService.isOnline$.subscribe((status: boolean) => {
      this.isOnline = status;
      if (!status && this.isEditMode) {
        this.showToast(
          'Se perdió la conexión. No se puede editar offline.',
          'warning'
        );
        this.router.navigate(['/areas']);
      }
    });
  }

  async loadEmpresas() {
    try {
      const response = await this.apiService.get<{
        success: boolean;
        data: Empresa[];
      }>('/empresas');
      if (response.success) {
        this.empresas = response.data.filter((e: Empresa) => e.activo);
      }
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
      await this.showToast(
        'Error al cargar empresas: ' + error.message,
        'danger'
      );
    }
  }

  async loadArea() {
    const loading = await this.loadingController.create({
      message: 'Cargando área...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<{
        success: boolean;
        data: Area;
      }>(`/areas/${this.areaId}`);

      if (response.success) {
        this.areaForm.patchValue(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar área:', error);
      await this.showToast('Error al cargar área: ' + error.message, 'danger');
      this.router.navigate(['/areas']);
    } finally {
      await loading.dismiss();
    }
  }

  async guardar() {
    if (this.areaForm.invalid) {
      await this.showToast(
        'Por favor completa todos los campos requeridos',
        'warning'
      );
      return;
    }

    if (!this.isOnline) {
      await this.showToast('Debes estar conectado para guardar', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando área...' : 'Creando área...',
    });
    await loading.present();

    try {
      const areaData = this.areaForm.value;

      if (this.isEditMode && this.areaId) {
        await this.apiService.put(`/areas/${this.areaId}`, areaData);
        await this.showToast('Área actualizada exitosamente', 'success');
      } else {
        await this.apiService.post('/areas', areaData);
        await this.showToast('Área creada exitosamente', 'success');
      }

      this.router.navigate(['/areas']);
    } catch (error: any) {
      console.error('Error al guardar área:', error);
      await this.showToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  cancelar() {
    this.router.navigate(['/areas']);
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
