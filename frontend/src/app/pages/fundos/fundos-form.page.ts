import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ToastController, LoadingController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-fundos-form',
  templateUrl: './fundos-form.page.html',
  styleUrls: ['./fundos-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class FundosFormPage implements OnInit {
  fundoForm!: FormGroup;
  isEditMode = false;
  fundoId?: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {
    addIcons({ arrowBackOutline, saveOutline });
  }

  async ngOnInit() {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.fundoId = parseInt(id, 10);
      await this.loadFundo();
    }
  }

  initForm() {
    this.fundoForm = this.fb.group({
      nombre: ['', Validators.required],
      ubicacion: [''],
      activo: [true],
    });
  }

  async loadFundo() {
    const loading = await this.loadingController.create({
      message: 'Cargando fundo...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<any>(`fundos/${this.fundoId}`);
      this.fundoForm.patchValue(response.data);
    } catch (error) {
      console.error('Error al cargar fundo:', error);
      this.showToast('Error al cargar fundo', 'danger');
      this.goBack();
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.fundoForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning',
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando fundo...' : 'Creando fundo...',
    });
    await loading.present();

    try {
      const data = this.fundoForm.value;

      if (this.isEditMode) {
        await this.apiService.put(`fundos/${this.fundoId}`, data);
        this.showToast('Fundo actualizado correctamente', 'success');
      } else {
        await this.apiService.post('fundos', data);
        this.showToast('Fundo creado correctamente', 'success');
      }

      this.goBack();
    } catch (error) {
      console.error('Error al guardar fundo:', error);
      this.showToast('Error al guardar fundo', 'danger');
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
    this.router.navigate(['/fundos']);
  }
}
