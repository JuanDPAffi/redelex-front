import { Routes } from '@angular/router';
import { Type } from '@angular/core';

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description?: string;
  menuItems: MenuItem[];
  routes?: Routes;
  providers?: Type<any>[];
  dependencies?: string[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: () => void;
  
  roles?: string[];
  permissions?: string[];
  
  enabled?: boolean;
  badge?: string | number;
  order?: number;

  sectionId?: string;
  matchRoutes?: string[];
}

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
  
  roles?: string[];
  permissions?: string[];
  
  order?: number;
}