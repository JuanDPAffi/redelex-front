import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

const CONSULTAR_PROCESO = '/panel/consultas/consultar-proceso';
const MIS_PROCESOS = '/panel/consultas/mis-procesos';

export const panelRedirectGuard: CanActivateFn = (): UrlTree | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUserData();

  if (!user) {
    // Si no está logueado (debería ser atrapado por el roleGuard padre, pero es seguro)
    return router.createUrlTree(['/auth/login']);
  }
  
  const currentRole = user.role;
  
  // LÓGICA SIMPLE:
  
  // 1. Role AFFI -> CONSULTAR PROCESO
  if (currentRole === 'affi') {
    return router.createUrlTree([CONSULTAR_PROCESO]);
  }
  
  // 2. Role ADMIN o INMOBILIARIA -> MIS PROCESOS
  if (currentRole === 'admin' || currentRole === 'inmobiliaria') {
    return router.createUrlTree([MIS_PROCESOS]);
  }
  
  // Fallback (Si el rol no es reconocido)
  return router.createUrlTree([MIS_PROCESOS]); 
};