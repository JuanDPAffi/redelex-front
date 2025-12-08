import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    // Carga perezosa (Lazy Loading) del componente standalone
    loadComponent: () => import('./pages/users-list/users-list.component')
      .then(m => m.UsersListComponent),
    // Protección: Solo entra si tiene el permiso 'users:view' (o es Admin)
    canActivate: [permissionGuard('users:view')]
  }
];