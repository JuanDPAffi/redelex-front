import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { permissionGuard } from '../../core/guards/permission.guard'; // Asegúrate de importar esto

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
      // Usamos roleGuard para asegurar que sea un usuario válido del sistema.
      // La seguridad de datos (ver propio vs ver todo) la hace el Backend.
      {
        path: 'proceso/:id',
        loadComponent: () => import('./pages/detalle-proceso/detalle-proceso')
          .then(m => m.DetalleProcesoComponent),
        canActivate: [roleGuard(['admin', 'affi', 'inmobiliaria'])]
      },

      // Default: Redirigir según el rol es complicado en rutas estáticas.
      // Lo ideal es que el login redirija. Aquí dejamos 'mis-procesos' por defecto
      // o podrías crear un componente 'Dashboard' inteligente.
      {
        path: '',
        redirectTo: 'mis-procesos',
        pathMatch: 'full'
      }
    ]
  }
];