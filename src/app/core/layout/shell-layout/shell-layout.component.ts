import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PluginRegistryService } from '../../services/plugin-registry.service';
import { MenuSection } from '../../models/plugin.interface';
import { FormsModule } from '@angular/forms';
// 1. IMPORTAR EL AUTH SERVICE
import { AuthService } from '../../../features/auth/services/auth.service';

interface UserData {
  nombre?: string;
  name?: string;
  rol?: string;
  role?: string;
  email?: string;
}

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  userName = 'Usuario';
  userRole = 'Invitado';
  userInitials = 'U';
  
  menuSections: MenuSection[] = [];
  breadcrumbs: { label: string, active?: boolean }[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private pluginRegistry: PluginRegistryService,
    private authService: AuthService // 2. INYECCIÓN DEL SERVICIO
  ) {}

  ngOnInit() {
    // A. Carga inicial rápida (lo que hay en cache/local)
    this.loadUserData();
    
    // B. SINCRONIZACIÓN REAL (La magia): 
    // Pedimos al backend los datos frescos. Si cambiaste el rol en BD, aquí se actualiza.
    this.authService.refreshUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          // Si el backend responde, actualizamos la vista inmediatamente
          this.updateUserView(user);
        },
        error: () => {
          // Si falla (ej: cookie expiró), el interceptor se encargará del logout
          console.log('No se pudo refrescar el perfil');
        }
      });

    this.loadMenuSections();
    this.handleResize();
    
    window.addEventListener('resize', this.handleResize.bind(this));

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateBreadcrumbs();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private loadMenuSections() {
    // 1. Obtener el rol actual del usuario (normalizado a 'role')
    const user = this.authService.getUserData();
    const currentRole = user?.role || 'guest';

    // Debug: Ver qué rol está detectando el menú
    console.log('🍔 Cargando menú para rol:', currentRole);

    this.pluginRegistry.getMenuSections()
      .pipe(takeUntil(this.destroy$))
      .subscribe(sections => {
        
        // 2. FILTRADO INTELIGENTE
        this.menuSections = sections.map(section => {
          // A. Filtrar ITEMS dentro de la sección
          const filteredItems = section.items.filter(item => {
            // Si no tiene roles definidos, es público
            if (!item.roles || item.roles.length === 0) return true;
            
            // Si tiene roles, verificamos si el mío está incluido
            return item.roles.includes(currentRole);
          });

          return { ...section, items: filteredItems };
        })
        // 3. Limpieza: Si una sección se quedó vacía tras el filtro, la ocultamos
        .filter(section => section.items.length > 0);

        this.updateBreadcrumbs();
      });
  }

  private updateBreadcrumbs() {
    this.breadcrumbs = [];
    for (const section of this.menuSections) {
      if (!section.items) continue;
      for (const item of section.items) {
        if (!item.route) continue;
        const routeCommands = Array.isArray(item.route) ? item.route : [item.route];
        const itemUrlTree = this.router.createUrlTree(routeCommands as any[]);
        
        if (this.router.isActive(itemUrlTree, { 
          paths: 'subset', 
          queryParams: 'ignored', 
          fragment: 'ignored', 
          matrixParams: 'ignored' 
        })) {
          this.breadcrumbs = [
            { label: section.title },
            { label: item.label, active: true }
          ];
          return;
        }
      }
    }
    if (this.breadcrumbs.length === 0) {
       this.breadcrumbs = [{ label: 'Inicio', active: true }];
    }
  }

  // Carga desde localStorage (rápido pero puede estar desactualizado)
  private loadUserData() {
    const userData = this.authService.getUserData(); // Usamos el helper del servicio si existe, o tu lógica manual
    if (userData) {
      this.updateUserView(userData);
    }
  }

  // Método auxiliar para actualizar las variables de la vista
  private updateUserView(data: any) {
    this.userName = data.nombre || data.name || data.email?.split('@')[0] || 'Usuario';
    // Importante: Aseguramos que 'rol' o 'role' se procesen
    const rawRole = data.rol || data.role || 'user';
    this.userRole = this.formatRole(rawRole);
    this.userInitials = this.getInitials(this.userName);
  }

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': 'Colaborador Affi',
      'user': 'Inmobiliaria',
      'guest': 'Invitado'
    };
    return roleMap[role.toLowerCase()] || role;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  handleResize() {
    if (window.innerWidth > 768) {
      this.sidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = !this.sidebarOpen;
      if (this.sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  logout() {
    localStorage.removeItem('redelex_user');
    localStorage.removeItem('redelex_token'); // Por si quedó basura vieja

    this.authService.logout(); 
    
    this.router.navigate(['/auth/login']);
  }
}