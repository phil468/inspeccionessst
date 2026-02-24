import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular/standalone';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { Rol } from '../../models/usuario.model';

@Component({
  selector: 'app-usuarios-form',
  templateUrl: './usuarios-form.page.html',
  styleUrls: ['./usuarios-form.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class UsuariosFormPage implements OnInit {
  usuarioForm!: FormGroup;
  isEditMode: boolean = false;
  usuarioId: number | null = null;
  roles: Rol[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    // Primero detectar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.usuarioId = parseInt(id);
    }

    // Luego inicializar el formulario con el modo correcto
    this.initForm();
    this.loadRoles();

    // Finalmente cargar el usuario si es edición
    if (this.isEditMode && this.usuarioId) {
      this.loadUsuario(this.usuarioId);
    }
  }

  initForm() {
    this.usuarioForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      activo: [1],
      role_id: ['', Validators.required],
    });

    // Validación condicional de password
    const passwordControl = this.usuarioForm.get('password');

    if (!this.isEditMode) {
      // En modo creación, password es obligatorio desde el inicio
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
    } else {
      // En modo edición, validar solo si se escribe algo
      passwordControl?.valueChanges.subscribe((value) => {
        if (value && value.trim().length > 0) {
          passwordControl?.setValidators([Validators.minLength(6)]);
        } else {
          passwordControl?.clearValidators();
        }
        passwordControl?.updateValueAndValidity({ emitEvent: false });
      });
    }
  }

  loadRoles() {
    this.usuarioService
      .getRoles()
      .then((response: any) => {
        this.roles = response.data || response;
      })
      .catch((error) => {
        console.error('Error cargando roles:', error);
      });
  }

  loadUsuario(id: number) {
    this.isLoading = true;
    this.usuarioService
      .getUsuario(id)
      .then((response: any) => {
        const usuario = response.data || response;
        this.usuarioForm.patchValue({
          name: usuario.name,
          email: usuario.email,
          activo: usuario.activo,
          role_id:
            usuario.roles && usuario.roles.length > 0
              ? usuario.roles[0].id
              : '',
        });
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error cargando usuario:', error);
        this.showAlert('Error al cargar usuario');
        this.isLoading = false;
      });
  }

  async guardar() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = { ...this.usuarioForm.value };

    // Si es edición y el password está vacío o solo tiene espacios, removerlo
    if (
      this.isEditMode &&
      (!formData.password || formData.password.trim() === '')
    ) {
      delete formData.password;
    }

    const request = this.isEditMode
      ? this.usuarioService.updateUsuario(this.usuarioId!, formData)
      : this.usuarioService.createUsuario(formData);

    request
      .then(() => {
        this.showAlert(
          this.isEditMode
            ? 'Usuario actualizado correctamente'
            : 'Usuario creado correctamente',
        );
        this.router.navigate(['/usuarios']);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error guardando usuario:', error);
        this.showAlert('Error al guardar usuario');
        this.isLoading = false;
      });
  }

  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Información',
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  volver() {
    this.router.navigate(['/usuarios']);
  }
}
