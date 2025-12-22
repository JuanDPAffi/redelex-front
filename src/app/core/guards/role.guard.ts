import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { AffiAlert } from '../../shared/services/affi-alert';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.getUserData();
    const currentRole = user?.role || '';
    
    if (!user) {
      router.navigate(['/auth/login']); 
      return false;
    }
    if (currentRole === 'admin') {
      return true;
    }
    if (allowedRoles.includes(currentRole)) {
      return true;
    }
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: `Tu perfil de usuario no tiene acceso a esta sección.`
    });
    router.navigate(['/panel']); 
    return false;
  };
};