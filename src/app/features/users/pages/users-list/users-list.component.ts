import { HostListener, ElementRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../services/users.service';
import { InmobiliariaLookupService, InmobiliariaLookup } from '../../services/inmobiliaria-lockup.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { FeatherModule } from 'angular-feather';
import { RegisterPayload } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  inmobiliarias: InmobiliariaLookup[] = []; 
  loading = true;

  // Estados de Modales
  showEditModal = false;
  showPermissionsModal = false;
  
  // Datos del Formulario
  selectedUser: Partial<User> = {}; 
  userPassword = ''; 
  isCreating = false;
  selectedInmoId: string = '';

  // --- NUEVO: Variable para el buscador ---
  searchTerm: string = '';

  availableRoles = [ /* ... tus roles ... */
    { value: 'admin', label: 'Administrador' },
    { value: 'affi', label: 'Colaborador Affi' },
    { value: 'inmobiliaria', label: 'Inmobiliaria' }
  ];

  availablePermissions = [ /* ... tus permisos ... */
    { key: 'users:view', label: 'Ver Usuarios' },
    { key: 'users:create', label: 'Crear Usuarios' },
    { key: 'users:edit', label: 'Editar Usuarios' },
    { key: 'users:activate', label: 'Activar/Desactivar Usuarios' },
    { key: 'inmo:view', label: 'Ver Inmobiliarias' },
    { key: 'inmo:create', label: 'Crear Inmobiliarias' },
    { key: 'inmo:edit', label: 'Editar Inmobiliarias' },
    { key: 'inmo:activate', label: 'Activar/Desactivar Inmobiliarias' },
    { key: 'procesos:view_all', label: 'Ver TODOS los Procesos (Global)' },
    { key: 'procesos:view_own', label: 'Ver Mis Procesos (Propio)' },
    { key: 'reports:view', label: 'Ver Reportes' },
    { key: 'utils:export', label: 'Exportar Datos' }
  ];

  tempPermissions: string[] = [];

  isDropdownOpen = false;
  inmoSearchTerm = '';

  constructor(
    private usersService: UsersService,
    private inmoLookupService: InmobiliariaLookupService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadInmobiliarias(); 
  }

  // ... (loadUsers y loadInmobiliarias se mantienen igual) ...
  loadUsers() {
    this.loading = true;
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        AffiAlert.fire({ icon: 'error', title: 'Error', text: 'Error cargando usuarios.' });
      }
    });
  }

  loadInmobiliarias() {
    this.inmoLookupService.getAll().subscribe({
      next: (data) => this.inmobiliarias = data,
      error: () => console.error('Error cargando inmobiliarias')
    });
  }

  // --- NUEVO: Getter para filtrar la tabla ---
  get filteredUsers() {
    // Si no hay término de búsqueda, devolvemos todos
    if (!this.searchTerm) return this.users;

    const term = this.searchTerm.toLowerCase();

    return this.users.filter(user => {
      // Buscamos por Nombre, Email, NIT o Nombre de Inmobiliaria
      return (
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.nit?.includes(term) ||
        user.nombreInmobiliaria?.toLowerCase().includes(term)
      );
    });
  }

  get searchableInmobiliarias() {
    const term = this.inmoSearchTerm.toLowerCase();
    return this.filteredInmobiliarias.filter(inmo => 
      inmo.nombreInmobiliaria.toLowerCase().includes(term) || 
      inmo.nit.includes(term)
    );
  }

  get filteredInmobiliarias() { /* ... tu lógica existente ... */
    if (this.selectedUser.role !== 'inmobiliaria') return [];
    return this.inmobiliarias.filter(inmo => {
      if (!inmo.emailRegistrado) return true;
      if (!this.isCreating && inmo.nit === this.selectedUser.nit) return true;
      return false;
    });
  }

  toggleDropdown() {
    if (!this.isCreating && this.selectedUser.role === 'inmobiliaria') {
        // En modo edición (no creando), permitimos abrir. 
        // Si quisieras bloquearlo en algún caso, pon la condición aquí.
        this.isDropdownOpen = !this.isDropdownOpen;
    } else if (this.isCreating) {
        this.isDropdownOpen = !this.isDropdownOpen;
    }
    
    // Al abrir, limpiar búsqueda y enfocar (opcional)
    if (this.isDropdownOpen) {
      this.inmoSearchTerm = '';
    }
  }

  selectInmobiliaria(inmo: InmobiliariaLookup) {
    this.selectedInmoId = inmo._id;
    this.selectedUser.nombreInmobiliaria = inmo.nombreInmobiliaria;
    this.selectedUser.nit = inmo.nit;
    this.selectedUser.codigoInmobiliaria = inmo.codigo;
    
    this.isDropdownOpen = false; // Cerrar al seleccionar
  }

  // Cerrar dropdown si hago clic fuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  openEditModal(user: User | null) { /* ... tu lógica existente ... */ 
    this.selectedInmoId = ''; 
    if (user) {
      this.isCreating = false;
      this.selectedUser = { ...user };
      this.userPassword = '';
      if (this.selectedUser.role === 'inmobiliaria') {
        const found = this.inmobiliarias.find(i => i.nit === this.selectedUser.nit);
        if (found) this.selectedInmoId = found._id;
      }
    } else {
      this.isCreating = true;
      this.selectedUser = {
        role: 'inmobiliaria', isActive: true,
        name: '', email: '', nit: '', codigoInmobiliaria: '', nombreInmobiliaria: ''
      };
      this.userPassword = '';
    }
    this.showEditModal = true;
  }

  onInmobiliariaSelect(inmoId: string) { /* ... */ 
    const selected = this.inmobiliarias.find(i => i._id === inmoId);
    if (selected) {
      this.selectedUser.nombreInmobiliaria = selected.nombreInmobiliaria;
      this.selectedUser.nit = selected.nit;
      this.selectedUser.codigoInmobiliaria = selected.codigo;
    }
  }

  onRoleChange(newRole: string) { /* ... */ 
    this.selectedUser.role = newRole;
    this.selectedInmoId = ''; 
    if (newRole === 'admin' || newRole === 'affi') {
      this.selectedUser.nit = '900053370';
      this.selectedUser.codigoInmobiliaria = 'AFFI';
      this.selectedUser.nombreInmobiliaria = 'AFFI UNIVERSAL';
    } else {
      this.selectedUser.nit = '';
      this.selectedUser.codigoInmobiliaria = '';
      this.selectedUser.nombreInmobiliaria = '';
    }
  }

  saveEditUser() { if (this.isCreating) this.createUser(); else this.updateUser(); }

  createUser() { /* ... tu lógica existente ... */ 
    if (!this.selectedUser.email || !this.userPassword || !this.selectedUser.name) {
      AffiAlert.fire({ icon: 'warning', title: 'Faltan datos', text: 'Nombre, Email y Contraseña son obligatorios.' });
      return;
    }
    if (this.selectedUser.role === 'inmobiliaria' && !this.selectedUser.nit) {
      AffiAlert.fire({ icon: 'warning', title: 'Selección requerida', text: 'Debes seleccionar una Inmobiliaria de la lista.' });
      return;
    }
    const payload: RegisterPayload = {
      name: this.selectedUser.name!,
      email: this.selectedUser.email!,
      password: this.userPassword,
      role: this.selectedUser.role,
      nit: this.selectedUser.nit,
      codigoInmobiliaria: this.selectedUser.codigoInmobiliaria
    };
    this.usersService.createUser(payload).subscribe({
      next: () => {
        this.showEditModal = false;
        const inmo = this.inmobiliarias.find(i => i.nit === payload.nit);
        if (inmo) inmo.emailRegistrado = payload.email; 
        AffiAlert.fire({ icon: 'success', title: 'Usuario creado', text: 'Se ha enviado el correo de activación.', timer: 2000 });
        this.loadUsers();
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al crear usuario.';
        AffiAlert.fire({ icon: 'error', title: 'Error', text: msg });
      }
    });
  }

  updateUser() { /* ... tu lógica existente ... */ 
    if (!this.selectedUser._id) return;
    const cleanPayload = {
      name: this.selectedUser.name,
      nombreInmobiliaria: this.selectedUser.nombreInmobiliaria,
      nit: this.selectedUser.nit,
      codigoInmobiliaria: this.selectedUser.codigoInmobiliaria,
    };
    this.usersService.updateUser(this.selectedUser._id, cleanPayload).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...updatedUser };
        }
        this.showEditModal = false;
        AffiAlert.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
      },
      error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' })
    });
  }

  openPermissionsModal(user: User) { /* ... */ 
    this.selectedUser = { ...user } as User; 
    this.tempPermissions = [...(user.permissions || [])];
    this.showPermissionsModal = true;
  }

  togglePermission(permKey: string) { /* ... */ 
    if (this.tempPermissions.includes(permKey)) {
      this.tempPermissions = this.tempPermissions.filter(p => p !== permKey);
    } else {
      this.tempPermissions.push(permKey);
    }
  }

  hasPermission(permKey: string): boolean {
    return this.tempPermissions.includes(permKey);
  }

  savePermissions() { /* ... */ 
    if (!this.selectedUser._id) return;
    this.usersService.updatePermissions(this.selectedUser._id, this.tempPermissions).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) this.users[index] = updatedUser;
        this.showPermissionsModal = false;
        AffiAlert.fire({ icon: 'success', title: 'Permisos actualizados', timer: 1500, showConfirmButton: false });
      },
      error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'Error guardando permisos.' })
    });
  }

  closeModals() {
    this.showEditModal = false;
    this.showPermissionsModal = false;
    this.selectedUser = {};
    this.userPassword = '';
  }

  toggleStatus(user: User) { /* ... */ 
    const accion = user.isActive ? 'desactivar' : 'activar';
    AffiAlert.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de ${accion} el acceso al usuario ${user.name}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: user.isActive ? '#d33' : '#10b981',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.toggleStatus(user._id).subscribe({
          next: () => {
            user.isActive = !user.isActive;
            AffiAlert.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
          },
          error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'Fallo al cambiar estado.' })
        });
      }
    });
  }

  changeRole(user: User, newRole: string) { /* ... */ 
    if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}? Esto reiniciará sus permisos.`)) return;
    this.usersService.changeRole(user._id, newRole).subscribe({
      next: (updated) => {
        const index = this.users.findIndex(u => u._id === updated._id);
        if (index !== -1) this.users[index] = updated;
        AffiAlert.fire({ icon: 'success', title: 'Rol actualizado', text: 'Permisos reiniciados.' });
      },
      error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el rol.' })
    });
  }
}