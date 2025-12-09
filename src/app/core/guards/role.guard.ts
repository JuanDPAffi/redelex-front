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
    
    // 1. CASO NO LOGUEADO (AUTENTICACIÓN)
    if (!user) {
      // Redirigir silenciosamente al login
      router.navigate(['/auth/login']); 
      return false;
    }
    
    // 2. PODER ABSOLUTO: Si es admin, pasa siempre
    if (currentRole === 'admin') {
      return true;
    }

    // 3. Validar si el rol está permitido (AUTORIZACIÓN)
    if (allowedRoles.includes(currentRole)) {
      return true;
    }

    // 4. DENIEGO Y ALERTA (Usuario logueado pero sin el rol)
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: `Tu perfil de usuario no tiene acceso a esta sección.`
    });

    // Lo enviamos a una ruta segura dentro de su panel
    router.navigate(['/panel']); 
    return false;
  };
};