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
  selector: 'app-lotes-form',
  templateUrl: './lotes-form.page.html',
  styleUrls: ['./lotes-form.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class LotesFormPage implements OnInit {
  loteForm!: FormGroup;
  fundos: any[] = [];
  isEditMode = false;
  loteId?: number;

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
    await this.loadFundos();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loteId = parseInt(id, 10);
      await this.loadLote();
    }
  }

  initForm() {
    this.loteForm = this.fb.group({
      nombre: ['', Validators.required],
      fundo_id: ['', Validators.required],
      activo: [true],
    });
  }

  async loadFundos() {
    try {
      const response = await this.apiService.get<any>('/fundos');
      this.fundos = response.data.filter((f: any) => f.activo);
    } catch (error) {
      console.error('Error al cargar fundos:', error);
    }
  }

  async loadLote() {
    const loading = await this.loadingController.create({
      message: 'Cargando lote...',
    });
    await loading.present();

    try {
      const response = await this.apiService.get<any>(`lotes/${this.loteId}`);
      this.loteForm.patchValue(response.data);
    } catch (error) {
      console.error('Error al cargar lote:', error);
      this.showToast('Error al cargar lote', 'danger');
      this.goBack();
    } finally {
      await loading.dismiss();
    }
  }

  async onSubmit() {
    if (this.loteForm.invalid) {
      this.showToast(
        'Por favor complete todos los campos requeridos',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Actualizando lote...' : 'Creando lote...',
    });
    await loading.present();

    try {
      const data = this.loteForm.value;

      if (this.isEditMode) {
        await this.apiService.put(`lotes/${this.loteId}`, data);
        this.showToast('Lote actualizado correctamente', 'success');
      } else {
        await this.apiService.post('lotes', data);
        this.showToast('Lote creado correctamente', 'success');
      }

      this.goBack();
    } catch (error) {
      console.error('Error al guardar lote:', error);
      this.showToast('Error al guardar lote', 'danger');
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
    this.router.navigate(['/lotes']);
  }
}
