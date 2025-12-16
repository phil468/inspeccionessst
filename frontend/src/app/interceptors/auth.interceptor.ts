import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Excluir rutas de autenticación
  const excludedUrls = ['/auth/microsoft', '/auth/microsoft/callback'];
  const isExcluded = excludedUrls.some((url) => req.url.includes(url));

  // Agregar token si existe y no es ruta excluida
  const token = authService.getToken();
  if (token && !isExcluded) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 (no autorizado), hacer logout
      if (error.status === 401 && !isExcluded) {
        authService.logout();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
