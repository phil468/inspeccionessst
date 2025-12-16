import { Component, OnInit } from '@angular/core';
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
import { ApiService } from '../../services/api.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-motivos-form',
  templateUrl: './motivos-form.page.html',
  styleUrls: ['./motivos-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class MotivosFormPage implements OnInit {
  motivoForm!: FormGroup;
  isEditMode = false;
  motivoId?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({ arrowBackOutline, saveOutline });
  }

  async ngOnInit() {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.motivoId = parseInt(id, 10);
      await this.loadMotivo();
    }
  }

  initForm() {
    this.motivoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      activo: [true],
    });
  }

  async loadMotivo() {
    const loading = await this.loadingController.create({
      message: 'Cargando motivo...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<any>(
        `motivos/${this.motivoId}`
      );
      this.motivoForm.patchValue(response.data);
    } catch (error) {
      console.error('Error al cargar motivo:', error);
      this.showToast('Error al cargar motivo', 'danger');
      this.goBack();
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.motivoForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando motivo...' : 'Creando motivo...',
    });
    await loading.present();

    try {
      const data = this.motivoForm.value;

      if (this.isEditMode) {
        await this.apiService.put(`motivos/${this.motivoId}`, data);
        this.showToast('Motivo actualizado correctamente', 'success');
      } else {
        await this.apiService.post('motivos', data);
        this.showToast('Motivo creado correctamente', 'success');
      }

      this.goBack();
    } catch (error) {
      console.error('Error al guardar motivo:', error);
      this.showToast('Error al guardar motivo', 'danger');
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
    this.router.navigate(['/motivos']);
  }
}
