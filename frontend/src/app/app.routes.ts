import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.page').then(
        (m) => m.AuthCallbackPage
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'registro-form',
        loadComponent: () =>
          import('./pages/registro-form/registro-form.page').then(
            (m) => m.RegistroFormPage
          ),
      },
      {
        path: 'registro-lista',
        loadComponent: () =>
          import('./pages/registro-lista/registro-lista.page').then(
            (m) => m.RegistroListaPage
          ),
      },
      {
        path: 'mantenimiento',
        loadComponent: () =>
          import('./pages/mantenimiento/mantenimiento.page').then(
            (m) => m.MantenimientoPage
          ),
      },
      {
        path: 'campanias',
        loadComponent: () =>
          import('./pages/campanias/campanias-lista.page').then(
            (m) => m.CampaniasListaPage
          ),
      },
      {
        path: 'campanias/nuevo',
        loadComponent: () =>
          import('./pages/campanias/campanias-form.page').then(
            (m) => m.CampaniasFormPage
          ),
      },
      {
        path: 'campanias/editar/:id',
        loadComponent: () =>
          import('./pages/campanias/campanias-form.page').then(
            (m) => m.CampaniasFormPage
          ),
      },
      {
        path: 'fundos',
        loadComponent: () =>
          import('./pages/fundos/fundos-lista.page').then(
            (m) => m.FundosListaPage
          ),
      },
      {
        path: 'fundos/nuevo',
        loadComponent: () =>
          import('./pages/fundos/fundos-form.page').then(
            (m) => m.FundosFormPage
          ),
      },
      {
        path: 'fundos/editar/:id',
        loadComponent: () =>
          import('./pages/fundos/fundos-form.page').then(
            (m) => m.FundosFormPage
          ),
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./pages/empresas/empresas-lista/empresas-lista.page').then(
            (m) => m.EmpresasListaPage
          ),
      },
      {
        path: 'empresas/form',
        loadComponent: () =>
          import('./pages/empresas/empresas-form/empresas-form.page').then(
            (m) => m.EmpresasFormPage
          ),
      },
      {
        path: 'empresas/form/:id',
        loadComponent: () =>
          import('./pages/empresas/empresas-form/empresas-form.page').then(
            (m) => m.EmpresasFormPage
          ),
      },
      {
        path: 'areas',
        loadComponent: () =>
          import('./pages/areas/areas-lista/areas-lista.page').then(
            (m) => m.AreasListaPage
          ),
      },
      {
        path: 'areas/form',
        loadComponent: () =>
          import('./pages/areas/areas-form/areas-form.page').then(
            (m) => m.AreasFormPage
          ),
      },
      {
        path: 'areas/form/:id',
        loadComponent: () =>
          import('./pages/areas/areas-form/areas-form.page').then(
            (m) => m.AreasFormPage
          ),
      },
      {
        path: 'inspecciones',
        loadComponent: () =>
          import(
            './pages/inspecciones/inspeccion-lista/inspeccion-lista.page'
          ).then((m) => m.InspeccionListaPage),
      },
      {
        path: 'inspecciones/form',
        loadComponent: () =>
          import(
            './pages/inspecciones/inspeccion-form/inspeccion-form.page'
          ).then((m) => m.InspeccionFormPage),
      },
      {
        path: 'inspecciones/form/:id',
        loadComponent: () =>
          import(
            './pages/inspecciones/inspeccion-form/inspeccion-form.page'
          ).then((m) => m.InspeccionFormPage),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/usuarios/usuarios-lista.page').then(
            (m) => m.UsuariosListaPage
          ),
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () =>
          import('./pages/usuarios/usuarios-form.page').then(
            (m) => m.UsuariosFormPage
          ),
      },
      {
        path: 'usuarios/editar/:id',
        loadComponent: () =>
          import('./pages/usuarios/usuarios-form.page').then(
            (m) => m.UsuariosFormPage
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles-lista.page').then(
            (m) => m.RolesListaPage
          ),
      },
      {
        path: 'roles/nuevo',
        loadComponent: () =>
          import('./pages/roles/roles-form.page').then((m) => m.RolesFormPage),
      },
      {
        path: 'roles/editar/:id',
        loadComponent: () =>
          import('./pages/roles/roles-form.page').then((m) => m.RolesFormPage),
      },
      {
        path: 'personal',
        loadComponent: () =>
          import('./pages/personal-lista/personal-lista.page').then(
            (m) => m.PersonalListaPage
          ),
      },
      {
        path: 'personal/nuevo',
        loadComponent: () =>
          import('./pages/personal-form/personal-form.page').then(
            (m) => m.PersonalFormPage
          ),
      },
      {
        path: 'personal/detalle/:detalleId',
        loadComponent: () =>
          import('./pages/personal-form/personal-form.page').then(
            (m) => m.PersonalFormPage
          ),
      },
      {
        path: 'personal/editar/:id',
        loadComponent: () =>
          import('./pages/personal-form/personal-form.page').then(
            (m) => m.PersonalFormPage
          ),
      },
      {
        path: 'cargos',
        loadComponent: () =>
          import('./pages/cargos/cargos-lista.page').then(
            (m) => m.CargosListaPage
          ),
      },
      {
        path: 'cargos/form',
        loadComponent: () =>
          import('./pages/cargos/cargos-form.page').then(
            (m) => m.CargosFormPage
          ),
      },
      {
        path: 'cargos/form/:id',
        loadComponent: () =>
          import('./pages/cargos/cargos-form.page').then(
            (m) => m.CargosFormPage
          ),
      },
      {
        path: 'mis-inspecciones',
        loadComponent: () =>
          import('./pages/mis-inspecciones/mis-inspecciones.component').then(
            (m) => m.MisInspeccionesComponent
          ),
      },
    ],
  },
];
