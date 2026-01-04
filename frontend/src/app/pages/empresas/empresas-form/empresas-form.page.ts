import { Component, OnInit } from '@angular/core';
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
import { Empresa } from '../../../models/catalogo.model';
import { addIcons } from 'ionicons';
import { saveOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empresas-form',
  templateUrl: './empresas-form.page.html',
  styleUrls: ['./empresas-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class EmpresasFormPage implements OnInit {
  empresaForm: FormGroup;
  empresaId?: number;
  isEditMode = false;
  isOnline = false;

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

    this.empresaForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(250)]],
      razon_social: ['', Validators.maxLength(250)],
      ruc: ['', [Validators.maxLength(11), Validators.pattern(/^\d{11}$/)]],
      domicilio: [''],
      actividad_economica: ['', Validators.maxLength(250)],
      activo: [true],
    });
  }

  async ngOnInit() {
    this.checkConnectivity();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId = parseInt(id, 10);
      this.isEditMode = true;
      await this.loadEmpresa();
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
        this.router.navigate(['/empresas']);
      }
    });
  }

  async loadEmpresa() {
    const loading = await this.loadingController.create({
      message: 'Cargando empresa...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<{
        success: boolean;
        data: Empresa;
      }>(`/empresas/${this.empresaId}`);

      if (response.success) {
        this.empresaForm.patchValue(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar empresa:', error);
      await this.showToast(
        'Error al cargar empresa: ' + error.message,
        'danger'
      );
      this.router.navigate(['/empresas']);
    } finally {
      await loading.dismiss();
    }
  }

  async guardar() {
    if (this.empresaForm.invalid) {
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
      message: this.isEditMode
        ? 'Actualizando empresa...'
        : 'Creando empresa...',
    });
    await loading.present();

    try {
      const empresaData = this.empresaForm.value;

      if (this.isEditMode && this.empresaId) {
        await this.apiService.put(`/empresas/${this.empresaId}`, empresaData);
        await this.showToast('Empresa actualizada exitosamente', 'success');
      } else {
        await this.apiService.post('/empresas', empresaData);
        await this.showToast('Empresa creada exitosamente', 'success');
      }

      this.router.navigate(['/empresas']);
    } catch (error: any) {
      console.error('Error al guardar empresa:', error);
      await this.showToast('Error al guardar: ' + error.message, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  cancelar() {
    this.router.navigate(['/empresas']);
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
