import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REDELEX_ROUTES: Routes = [
  {
    path: '',
    children: [
      // 1. Mis Procesos
      {
        path: 'mis-procesos',
        loadComponent: () => import('./pages/mis-procesos/mis-procesos')
          .then(m => m.MisProcesosComponent),
        canActivate: [roleGuard(['user', 'admin'])]
      },

      // 2. Consultar Proceso
      {
        path: 'consultar-proceso',
        loadComponent: () => import('./pages/consultar-proceso/consultar-proceso')
          .then(m => m.ConsultarProcesoComponent),
        canActivate: [roleGuard(['admin'])]
      },

      // 3. AQUÍ ESTABA EL ERROR: Informe Inmobiliaria
      // Debes asegurarte de tener la línea 'loadComponent' completa
      {
        path: 'informe-inmobiliaria',
        loadComponent: () => import('./pages/informe-inmobiliaria/informe-inmobiliaria')
          .then(m => m.InformeInmobiliariaComponent),
        canActivate: [roleGuard(['admin'])]
      },

      // 4. Detalle Proceso
      {
        path: 'proceso/:id',
        loadComponent: () => import('./pages/detalle-proceso/detalle-proceso')
          .then(m => m.DetalleProcesoComponent),
        canActivate: [roleGuard(['admin', 'user'])]
      },

      // Default
      {
        path: '',
        redirectTo: 'mis-procesos',
        pathMatch: 'full'
      }
    ]
  }
];