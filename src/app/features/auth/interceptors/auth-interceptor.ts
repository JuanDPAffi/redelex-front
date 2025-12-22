import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AffiAlert } from '../../../shared/services/affi-alert';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const cloned = req.clone({
    withCredentials: true 
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {

      if (req.url.includes('/auth/login')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        
        AffiAlert.fire({
          icon: 'warning',
          title: 'Sesión Finalizada',
          text: 'Tu sesión ha expirado o tu cuenta ha cambiado de estado.',
          timer: 3000,
          timerProgressBar: true
        });

        authService.logoutClientSide();
        router.navigate(['/auth/login']);

        return EMPTY; 
      }

      return throwError(() => error);
    })
  );
};