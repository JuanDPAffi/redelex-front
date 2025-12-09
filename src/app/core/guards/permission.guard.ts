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
    
    const user = authService.getUserData();
    
    // 1. CASO NO LOGUEADO (AUTENTICACIÓN)
    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    // 2. VALIDAR PERMISOS (AUTORIZACIÓN)
    if (authService.hasPermission(requiredPermission)) {
      return true;
    }

    // 3. DENIEGO Y REDIRECCIÓN INTELIGENTE
    console.warn(`⛔ Acceso denegado. Se requiere permiso: ${requiredPermission}`);
    
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Restringido',
      text: 'No tienes los permisos necesarios para acceder a esta sección.'
    });

    // SOLUCIÓN: Redirigir según los permisos del usuario
    const redirectRoute = getDefaultRouteForUser(authService);
    router.navigate([redirectRoute]); 
    return false;
  };
};

/**
 * Función helper que determina la ruta por defecto según permisos
 * Evita bucles infinitos al redirigir a una ruta que SÍ puede acceder
 */
function getDefaultRouteForUser(authService: AuthService): string {
  const user = authService.getUserData();
  
  if (!user) {
    return '/auth/login';
  }

  // Admin va a consultar proceso (tiene procesos:view_all)
  if (user.role === 'admin') {
    return '/panel/consultas/consultar-proceso';
  }

  // AFFI: Tiene procesos:view_all, NO tiene procesos:view_own
  if (authService.hasPermission('procesos:view_all')) {
    return '/panel/consultas/consultar-proceso';
  }

  // INMOBILIARIA: Tiene procesos:view_own, NO tiene procesos:view_all
  if (authService.hasPermission('procesos:view_own')) {
    return '/panel/consultas/mis-procesos';
  }

  // Si no tiene ningún permiso de procesos, llevarlo a una página genérica
  // (podrías crear un dashboard o página de bienvenida)
  return '/panel/consultas/consultar-proceso'; // Fallback seguro
}