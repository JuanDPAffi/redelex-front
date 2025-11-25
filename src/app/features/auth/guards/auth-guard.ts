import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // CAMBIO: Usamos isLoggedIn() en lugar de getToken()
  if (authService.isLoggedIn()) {
    return true;
  }

  // Si no está logueado, redirigir al login
  router.navigate(['/auth/login']);
  return false;
};