import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard'; 
import { panelRedirectGuard } from './core/guards/panel-redirect.guard'; 

export const routes: Routes = [
  // Redirección inicial
  {
    path: '',
    redirectTo: '/panel',
    pathMatch: 'full'
  },

  // Rutas Públicas (Auth)
  {
    path: 'auth',
    loadChildren: () => 
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Rutas Privadas (Panel Principal)
  {
    path: 'panel',
    loadComponent: () => 
      import('./core/layout/shell-layout/shell-layout.component')
        .then(m => m.ShellLayoutComponent),
    canActivate: [roleGuard(['admin', 'affi', 'inmobiliaria'])],
    children: [
      // Módulos (consultas, usuarios, inmobiliarias)
      {
        path: 'consultas',
        loadChildren: () => 
          import('./features/redelex/redelex.routes').then(m => m.REDELEX_ROUTES)
      },
      {
        path: 'usuarios',
        loadChildren: () => 
          import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'inmobiliarias',
        loadChildren: () => import('./features/inmobiliaria/inmobiliaria.routes')
          .then(m => m.INMOBILIARIA_ROUTES)
      },
      
      // --- RUTA DEFAULT INTELIGENTE (SOLUCIÓN FINAL) ---
      {
        path: '',
        canActivate: [panelRedirectGuard], // El Guard ejecuta la lógica y navega
        loadComponent: () => 
          import('./core/components/empty-redirect/empty-redirect.component')
            .then(m => m.EmptyRedirectComponent), // Componente estructural vacío para el router
        pathMatch: 'full' // Mantener full para asegurar que anule los módulos, 
                          // aunque el loadComponent sea el que satisfaga la necesidad estructural
      }
    ]
  },

  // Catch-all (404)
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];