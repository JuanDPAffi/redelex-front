import { PluginConfig } from '../../core/models/plugin.interface';
import { AUTH_ROUTES } from './auth.routes';

export const AUTH_PLUGIN_CONFIG: PluginConfig = {
  id: 'auth',
  name: 'Autenticación',
  version: '1.0.0',
  enabled: true,
  description: 'Sistema de autenticación y gestión de usuarios',
  
  menuItems: [],
  
  routes: AUTH_ROUTES,
  
  dependencies: []
};