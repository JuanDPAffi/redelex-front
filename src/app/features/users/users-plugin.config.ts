import { PluginConfig } from '../../core/models/plugin.interface';
import { USERS_ROUTES } from './users.routes';

export const USERS_PLUGIN_CONFIG: PluginConfig = {
  id: 'users',
  name: 'Gestión de Usuarios',
  version: '1.0.0',
  enabled: true,
  description: 'Administración de usuarios y permisos',
  
  menuItems: [
    {
      id: 'users-list',
      label: 'Usuarios',
      icon: 'users', // Asegúrate de tener un ícono 'users' o usa 'user'
      route: '/panel/usuarios',
      permissions: ['users:view'],
      roles: ['admin'], // Fallback legacy
      enabled: true,
      order: 2,
      sectionId: 'sistema'
    }
  ],
  
  routes: USERS_ROUTES,
  
  dependencies: ['auth']
};