import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard'; // Usamos el nuevo Guard

export const routes: Routes = [
  // Redirección inicial
  {
    path: '',
    redirectTo: '/panel',
    pathMatch: 'full'
  },

  // Rutas Públicas (Login, Registro)
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
    // Protegemos el panel: Solo entran roles válidos
    canActivate: [roleGuard(['admin', 'affi', 'inmobiliaria'])],
    children: [
      // Módulo Redelex (Consultas)
      {
        path: 'consultas',
        loadChildren: () => 
          import('./features/redelex/redelex.routes')
            .then(m => m.REDELEX_ROUTES)
      },
      // NUEVO: Módulo Usuarios (Sistema)
      {
        path: 'usuarios',
        loadChildren: () => 
          import('./features/users/users.routes')
            .then(m => m.USERS_ROUTES)
      },
      // Default del panel
      {
        path: '',
        redirectTo: 'consultas/mis-procesos', // O la ruta que prefieras por defecto
        pathMatch: 'full'
      }
    ]
  },

  // Catch-all (404)
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];