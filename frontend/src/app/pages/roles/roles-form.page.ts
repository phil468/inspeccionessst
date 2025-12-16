import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { Permission } from '../../models/usuario.model';

interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-roles-form',
  templateUrl: './roles-form.page.html',
  styleUrls: ['./roles-form.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
})
export class RolesFormPage implements OnInit {
  rolForm!: FormGroup;
  isEditMode: boolean = false;
  rolId: number | null = null;
  permissionGroups: PermissionGroup[] = [];
  selectedPermissions: number[] = [];
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadPermisos();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.rolId = parseInt(id);
      this.loadRol(this.rolId);
    }
  }

  initForm() {
    this.rolForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
    });
  }

  loadPermisos() {
    this.usuarioService
      .getPermisos()
      .then((response: any) => {
        const permissions = response.data || response;
        this.groupPermissions(permissions);
      })
      .catch((error) => {
        console.error('Error cargando permisos:', error);
      });
  }

  groupPermissions(permissions: Permission[]) {
    const grouped = new Map<string, Permission[]>();

    permissions.forEach((permission) => {
      const resource = permission.resource;
      if (!grouped.has(resource)) {
        grouped.set(resource, []);
      }
      grouped.get(resource)!.push(permission);
    });

    this.permissionGroups = Array.from(grouped.entries()).map(
      ([resource, perms]) => ({
        resource,
        permissions: perms.sort((a, b) => a.action.localeCompare(b.action)),
      })
    );
  }

  loadRol(id: number) {
    this.isLoading = true;
    this.usuarioService
      .getRol(id)
      .then((response: any) => {
        const rol = response.data || response;
        this.rolForm.patchValue({
          name: rol.name,
          description: rol.description,
        });
        this.selectedPermissions =
          rol.permissions?.map((p: Permission) => p.id!) || [];
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error cargando rol:', error);
        this.showAlert('Error al cargar rol');
        this.isLoading = false;
      });
  }

  togglePermission(permissionId: number) {
    const index = this.selectedPermissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedPermissions.splice(index, 1);
    } else {
      this.selectedPermissions.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  selectAllInGroup(group: PermissionGroup) {
    const allSelected = group.permissions.every((p) =>
      this.selectedPermissions.includes(p.id!)
    );

    if (allSelected) {
      // Deseleccionar todos
      group.permissions.forEach((p) => {
        const index = this.selectedPermissions.indexOf(p.id!);
        if (index > -1) {
          this.selectedPermissions.splice(index, 1);
        }
      });
    } else {
      // Seleccionar todos
      group.permissions.forEach((p) => {
        if (!this.selectedPermissions.includes(p.id!)) {
          this.selectedPermissions.push(p.id!);
        }
      });
    }
  }

  isGroupFullySelected(group: PermissionGroup): boolean {
    return group.permissions.every((p) =>
      this.selectedPermissions.includes(p.id!)
    );
  }

  async guardar() {
    if (this.rolForm.invalid) {
      this.rolForm.markAllAsTouched();
      return;
    }

    if (this.selectedPermissions.length === 0) {
      this.showAlert('Debes seleccionar al menos un permiso');
      return;
    }

    this.isLoading = true;
    const formData = {
      ...this.rolForm.value,
      permissions: this.selectedPermissions,
    };

    const request = this.isEditMode
      ? this.usuarioService.updateRol(this.rolId!, formData)
      : this.usuarioService.createRol(formData);

    request
      .then(() => {
        this.showAlert(
          this.isEditMode
            ? 'Rol actualizado correctamente'
            : 'Rol creado correctamente'
        );
        this.router.navigate(['/roles']);
        this.isLoading = false;
      })
      .catch((error) => {
        console.error('Error guardando rol:', error);
        this.showAlert('Error al guardar rol');
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
    this.router.navigate(['/roles']);
  }
}
