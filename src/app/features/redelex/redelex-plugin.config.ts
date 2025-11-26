// src/app/features/redelex/redelex-plugin.config.ts
// 🆕 Archivo NUEVO - Crear en la nueva carpeta features/redelex/

import { PluginConfig } from '../../core/models/plugin.interface';
import { REDELEX_ROUTES } from './redelex.routes';

export const REDELEX_PLUGIN_CONFIG: PluginConfig = {
  id: 'redelex',
  name: 'Consulta de Procesos',
  version: '1.0.0',
  enabled: true,
  description: 'Consulta y gestión de procesos legales de Redelex',
  
  // Items que se agregarán automáticamente al menú
  menuItems: [
    {
      id: 'redelex-consultar',
      label: 'Consultar Procesos',
      icon: 'file-text',
      route: '/panel/consultas/consultar-proceso',
      roles: ['admin'],
      enabled: true,
      order: 1
    },
    {
      id: 'redelex-informe',
      label: 'Informe Inmobiliaria',
      icon: 'file-text',
      route: '/panel/consultas/informe-inmobiliaria',
      roles: ['admin'],
      enabled: true,
      // badge: 'Nuevo',
      order: 2
    },
    {
      id: 'redelex-mis-procesos',
      label: 'Mis Procesos',
      icon: 'file-text',
      route: '/panel/consultas/mis-procesos',
      roles: ['user'],
      enabled: true,
      order: 3
    }
  ],
  
  routes: REDELEX_ROUTES,
  
  dependencies: ['auth']
};