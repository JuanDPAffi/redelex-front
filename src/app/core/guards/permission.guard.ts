import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { AffiAlert } from '../../shared/services/affi-alert';

/**
 * Guard para proteger rutas basándose en PERMISOS granulares
 * Uso: canActivate: [permissionGuard('users:view')]
 */
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Usamos el helper centralizado
    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    // Bloqueo
    console.warn(`⛔ Acceso denegado. Se requiere permiso: ${requiredPermission}`);
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Restringido',
      text: 'No tienes los permisos necesarios para acceder a esta sección.'
    });

    router.navigate(['/home']); // O al dashboard por defecto
    return false;
  };
};