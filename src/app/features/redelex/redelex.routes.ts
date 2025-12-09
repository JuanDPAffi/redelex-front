import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { AuthService } from '../auth/services/auth.service';

/**
 * Guard inteligente que redirige según permisos del usuario
 * Evita el bucle infinito al NO bloquear, sino redirigir correctamente
 */
const smartDefaultRedirect = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getUserData();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Redirigir según permisos
  if (authService.hasPermission('procesos:view_all')) {
    // AFFI o ADMIN -> Consultar Proceso
    router.navigate(['/panel/consultas/consultar-proceso']);
  } else if (authService.hasPermission('procesos:view_own')) {
    // INMOBILIARIA -> Mis Procesos
    router.navigate(['/panel/consultas/mis-procesos']);
  } else {
    // Fallback: Usuario sin permisos de procesos (edge case)
    router.navigate(['/panel/consultas/consultar-proceso']);
  }
  
  return false; // Siempre retorna false porque ya hicimos la navegación
};

export const REDELEX_ROUTES: Routes = [
  {
    path: '',
    children: [
      // 1. Mis Procesos (Solo para Inmobiliarias)
      // Requiere permiso: 'procesos:view_own'
      {
        path: 'mis-procesos',
        loadComponent: () => import('./pages/mis-procesos/mis-procesos')
          .then(m => m.MisProcesosComponent),
        canActivate: [permissionGuard('procesos:view_own')] 
      },

      // 2. Consultar Proceso (Buscador Global para Affi/Admin)
      // Requiere permiso: 'procesos:view_all'
      {
        path: 'consultar-proceso',
        loadComponent: () => import('./pages/consultar-proceso/consultar-proceso')
          .then(m => m.ConsultarProcesoComponent),
        canActivate: [permissionGuard('procesos:view_all')]
      },

      // 3. Informe Inmobiliaria (Reportes)
      // Requiere permiso: 'reports:view'
      {
        path: 'informe-inmobiliaria',
        loadComponent: () => import('./pages/informe-inmobiliaria/informe-inmobiliaria')
          .then(m => m.InformeInmobiliariaComponent),
        canActivate: [permissionGuard('reports:view')]
      },

      // 4. Detalle Proceso (Compartido)
      // Aquí entran tanto Inmobiliarias como Affis.
      // La seguridad de datos (ver propio vs ver todo) la hace el Backend.
      {
        path: 'proceso/:id',
        loadComponent: () => import('./pages/detalle-proceso/detalle-proceso')
          .then(m => m.DetalleProcesoComponent),
        canActivate: [roleGuard(['admin', 'affi', 'inmobiliaria'])]
      },

      // CAMBIO CRÍTICO: Ruta default con redirección inteligente
      {
        path: '',
        canActivate: [smartDefaultRedirect],
        children: [] // Necesario para que Angular no crashee
      }
    ]
  }
];