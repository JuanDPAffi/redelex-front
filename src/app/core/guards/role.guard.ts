import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { AffiAlert } from '../../shared/services/affi-alert';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // Obtenemos el usuario
    const user = authService.getUserData();
    
    // Debug para ver qué está leyendo el Guard
    console.log('🛡️ Guard Check:', { userRole: user?.role, allowed: allowedRoles });

    // 1. Validamos: Si existe usuario y su rol está en la lista permitida
    // Aseguramos que lea 'role' (inglés) que es como lo guarda tu AuthService ahora
    if (user && allowedRoles.includes(user.role || '')) {
      return true;
    }

    // 2. Si NO tiene permiso:
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: `No tienes permisos para acceder. Tu rol es: ${user?.role || 'Desconocido'}`
    });

    // 3. ROMPER EL BUCLE (CORRECCIÓN CRÍTICA)
    // Si no tiene permiso, lo sacamos al Login. 
    // NUNCA lo redirigas a la misma página interna si el Guard falló.
    router.navigate(['/auth/login']);

    return false;
  };
};