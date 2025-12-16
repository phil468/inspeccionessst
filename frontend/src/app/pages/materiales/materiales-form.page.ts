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
  selector: 'app-materiales-form',
  templateUrl: './materiales-form.page.html',
  styleUrls: ['./materiales-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class MaterialesFormPage implements OnInit {
  materialForm!: FormGroup;
  isEditMode = false;
  materialId?: number;

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
      this.materialId = parseInt(id, 10);
      await this.loadMaterial();
    }
  }

  initForm() {
    this.materialForm = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      activo: [true],
    });
  }

  async loadMaterial() {
    const loading = await this.loadingController.create({
      message: 'Cargando material...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<any>(
        `materiales/${this.materialId}`
      );
      this.materialForm.patchValue(response.data);
    } catch (error) {
      console.error('Error al cargar material:', error);
      this.showToast('Error al cargar material', 'danger');
      this.goBack();
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.materialForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode
        ? 'Actualizando material...'
        : 'Creando material...',
    });
    await loading.present();

    try {
      const data = this.materialForm.value;

      if (this.isEditMode) {
        await this.apiService.put(`materiales/${this.materialId}`, data);
        this.showToast('Material actualizado correctamente', 'success');
      } else {
        await this.apiService.post('materiales', data);
        this.showToast('Material creado correctamente', 'success');
      }

      this.goBack();
    } catch (error) {
      console.error('Error al guardar material:', error);
      this.showToast('Error al guardar material', 'danger');
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
    this.router.navigate(['/materiales']);
  }
}
