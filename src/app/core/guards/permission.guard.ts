import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { AffiAlert } from '../../shared/services/affi-alert';

export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const user = authService.getUserData();

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    console.warn(`⛔ Acceso denegado. Se requiere permiso: ${requiredPermission}`);
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Restringido',
      text: 'No tienes los permisos necesarios para acceder a esta sección.'
    });
    router.navigate(['/panel']); 
    return false;
  };
};