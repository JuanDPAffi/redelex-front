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
    
    // 1. PODER ABSOLUTO: Si es admin, pasa siempre
    if (currentRole === 'admin') {
      return true;
    }

    // 2. Validar si el rol está permitido
    if (user && allowedRoles.includes(currentRole)) {
      return true;
    }

    // 3. Denegar
    AffiAlert.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: `Tu perfil de usuario no tiene acceso a esta sección.`
    });

    router.navigate(['/home']); // Redirigir a un lugar seguro en vez de login si ya está logueado
    return false;
  };
};