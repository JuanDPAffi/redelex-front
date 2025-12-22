import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const INMOBILIARIA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inmobiliaria-list/inmobiliaria-list.component')
      .then(m => m.InmobiliariaListComponent),
    canActivate: [permissionGuard('inmo:view')]
  }
];