import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // CAMBIO: Ya no buscamos el token. 
  // Solo le decimos a Angular que envíe las cookies (withCredentials: true)
  const cloned = req.clone({
    withCredentials: true 
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos 401, el backend nos rechazó la cookie -> Logout
      if (error.status === 401) {
        authService.logoutClientSide();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};