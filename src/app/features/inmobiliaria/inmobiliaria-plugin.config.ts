import { PluginConfig } from '../../core/models/plugin.interface';
import { INMOBILIARIA_ROUTES } from './inmobiliaria.routes';

export const INMOBILIARIA_PLUGIN_CONFIG: PluginConfig = {
  id: 'inmobiliaria',
  name: 'Gestión de Inmobiliarias',
  version: '1.0.0',
  enabled: true,

  menuItems: [
    {
      id: 'inmo-list',
      label: 'Inmobiliarias',
      icon: 'home',
      route: '/panel/inmobiliarias',
      permissions: ['inmo:view'],
      roles: ['admin'],
      enabled: true,
      order: 1,
      sectionId: 'sistema'
    }
  ],
  routes: INMOBILIARIA_ROUTES,
  dependencies: ['auth']
};