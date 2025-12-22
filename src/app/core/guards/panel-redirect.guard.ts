import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const panelRedirectGuard: CanActivateFn = (): UrlTree | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth/login']);
  }
  
  const targetUrl = authService.getRedirectUrl();
  
  return router.createUrlTree([targetUrl]);
};