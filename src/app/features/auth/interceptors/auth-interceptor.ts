import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, EMPTY } from 'rxjs'; // <--- 1. IMPORTAR EMPTY
import { AuthService } from '../services/auth.service';
import { AffiAlert } from '../../../shared/services/affi-alert'; // Importa tu alerta si quieres avisar del cierre

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const cloned = req.clone({
    withCredentials: true 
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Si es 401 (Token vencido o Usuario inactivo)
      if (error.status === 401) {
        
        // A. (Opcional) Mostrar alerta bonita de "Sesión Caducada"
        // Si no pones esto, el usuario solo aparecerá en el login de la nada.
        AffiAlert.fire({
          icon: 'warning',
          title: 'Sesión Finalizada',
          text: 'Tu sesión ha expirado o tu cuenta ha cambiado de estado.',
          timer: 3000,
          timerProgressBar: true
        });

        // B. Limpieza y Redirección
        authService.logoutClientSide();
        router.navigate(['/auth/login']);

        // C. LA MAGIA: Retornamos EMPTY
        // Esto hace que el .subscribe({ error: ... }) del componente NUNCA se ejecute
        return EMPTY; 
      }

      // Si es otro error (404, 500), sí dejamos que pase al componente
      return throwError(() => error);
    })
  );
};