import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
        path: 'materiales',
        loadComponent: () =>
          import('./pages/materiales/materiales-lista.page').then(
            (m) => m.MaterialesListaPage
          ),
      },
      {
        path: 'materiales/nuevo',
        loadComponent: () =>
          import('./pages/materiales/materiales-form.page').then(
            (m) => m.MaterialesFormPage
          ),
      },
      {
        path: 'materiales/editar/:id',
        loadComponent: () =>
          import('./pages/materiales/materiales-form.page').then(
            (m) => m.MaterialesFormPage
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
        path: 'lotes',
        loadComponent: () =>
          import('./pages/lotes/lotes-lista.page').then(
            (m) => m.LotesListaPage
          ),
      },
      {
        path: 'lotes/nuevo',
        loadComponent: () =>
          import('./pages/lotes/lotes-form.page').then((m) => m.LotesFormPage),
      },
      {
        path: 'lotes/editar/:id',
        loadComponent: () =>
          import('./pages/lotes/lotes-form.page').then((m) => m.LotesFormPage),
      },
      {
        path: 'motivos',
        loadComponent: () =>
          import('./pages/motivos/motivos-lista.page').then(
            (m) => m.MotivosListaPage
          ),
      },
      {
        path: 'motivos/nuevo',
        loadComponent: () =>
          import('./pages/motivos/motivos-form.page').then(
            (m) => m.MotivosFormPage
          ),
      },
      {
        path: 'motivos/editar/:id',
        loadComponent: () =>
          import('./pages/motivos/motivos-form.page').then(
            (m) => m.MotivosFormPage
          ),
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
    ],
  },
];
