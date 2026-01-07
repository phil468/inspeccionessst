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
import { ApiService } from '../../services/api.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-campanias-form',
  templateUrl: './campanias-form.page.html',
  styleUrls: ['./campanias-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class CampaniasFormPage implements OnInit {
  campaniaForm!: FormGroup;
  isEditMode = false;
  campaniaId?: number;

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
      this.campaniaId = parseInt(id, 10);
      await this.loadCampania();
    }
  }

  initForm() {
    this.campaniaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      activo: [true],
    });
  }

  async loadCampania() {
    const loading = await this.loadingController.create({
      message: 'Cargando campaña...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<any>(
        `/campanias/${this.campaniaId}`
      );
      this.campaniaForm.patchValue(response.data);
    } catch (error) {
      console.error('Error al cargar campaña:', error);
      this.showToast('Error al cargar campaña', 'danger');
      this.goBack();
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.campaniaForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode
        ? 'Actualizando campaña...'
        : 'Creando campaña...',
    });
    await loading.present();

    try {
      const data = this.campaniaForm.value;

      if (this.isEditMode) {
        await this.apiService.put(`/campanias/${this.campaniaId}`, data);
        this.showToast('Campaña actualizada correctamente', 'success');
      } else {
        await this.apiService.post('/campanias', data);
        this.showToast('Campaña creada correctamente', 'success');
      }

      this.goBack();
    } catch (error) {
      console.error('Error al guardar campaña:', error);
      this.showToast('Error al guardar campaña', 'danger');
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
    this.router.navigate(['/campanias']);
  }
}
