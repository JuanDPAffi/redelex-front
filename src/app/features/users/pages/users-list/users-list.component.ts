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

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // --- FILTROS AVANZADOS ---
  filtros = {
    busquedaGeneral: '',
    rol: '',
    estado: '',
    nit: '',
    nombreInmobiliaria: ''
  };

  // Lista única de roles y estados disponibles
  listaRoles: string[] = [];
  listaEstados = ['Activo', 'Inactivo'];

  // Control de dropdowns
  activeDropdown: string | null = null;

  availableRoles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'affi', label: 'Colaborador Affi' },
    { value: 'inmobiliaria', label: 'Inmobiliaria' }
  ];

  availablePermissions = [
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


  loadUsers() {
    this.loading = true;
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.extraerListasUnicas();
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

  // --- EXTRAER LISTAS ÚNICAS PARA FILTROS ---
  extraerListasUnicas() {
    const rolesSet = new Set<string>();
    this.users.forEach(user => {
      if (user.role) {
        const roleLabel = this.availableRoles.find(r => r.value === user.role)?.label || user.role;
        rolesSet.add(roleLabel);
      }
    });
    this.listaRoles = Array.from(rolesSet).sort();
  }

  // --- FILTROS ---
  get filteredUsers() {
    return this.users.filter(user => {
      // Búsqueda General
      if (this.filtros.busquedaGeneral) {
        const term = this.filtros.busquedaGeneral.toLowerCase();
        const match = 
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.nit?.includes(term) ||
          user.nombreInmobiliaria?.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Filtro por Rol
      if (this.filtros.rol) {
        const roleLabel = this.availableRoles.find(r => r.value === user.role)?.label || user.role;
        if (roleLabel !== this.filtros.rol) return false;
      }

      // Filtro por Estado
      if (this.filtros.estado) {
        const estadoUsuario = user.isActive ? 'Activo' : 'Inactivo';
        if (estadoUsuario !== this.filtros.estado) return false;
      }

      // Filtro por NIT
      if (this.filtros.nit && !user.nit?.includes(this.filtros.nit)) return false;

      // Filtro por Nombre Inmobiliaria
      if (this.filtros.nombreInmobiliaria && !user.nombreInmobiliaria?.toLowerCase().includes(this.filtros.nombreInmobiliaria.toLowerCase())) return false;

      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      busquedaGeneral: '',
      rol: '',
      estado: '',
      nit: '',
      nombreInmobiliaria: ''
    };
    this.currentPage = 1;
  }

  // --- PAGINACIÓN ---
  get paginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  selectPageSize(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.activeDropdown = null;
  }

  // --- CONTROL DE DROPDOWNS ---
  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  selectFilterOption(filterKey: 'rol' | 'estado', value: string) {
    this.filtros[filterKey] = value;
    this.activeDropdown = null;
    this.currentPage = 1; // Reset a página 1 al filtrar
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeDropdown = null;
      this.isDropdownOpen = false;
    }
  }

  get searchableInmobiliarias() {
    const term = this.inmoSearchTerm.toLowerCase();
    return this.filteredInmobiliarias.filter(inmo => 
      inmo.nombreInmobiliaria.toLowerCase().includes(term) || 
      inmo.nit.includes(term)
    );
  }

  get filteredInmobiliarias() {
    if (this.selectedUser.role !== 'inmobiliaria') return [];
    return this.inmobiliarias.filter(inmo => {
      if (!inmo.emailRegistrado) return true;
      if (!this.isCreating && inmo.nit === this.selectedUser.nit) return true;
      return false;
    });
  }

  toggleDropdownInmo() {
    if (!this.isCreating && this.selectedUser.role === 'inmobiliaria') {
      this.isDropdownOpen = !this.isDropdownOpen;
    } else if (this.isCreating) {
      this.isDropdownOpen = !this.isDropdownOpen;
    }
    
    if (this.isDropdownOpen) {
      this.inmoSearchTerm = '';
    }
  }

  selectInmobiliaria(inmo: InmobiliariaLookup) {
    this.selectedInmoId = inmo._id;
    this.selectedUser.nombreInmobiliaria = inmo.nombreInmobiliaria;
    this.selectedUser.nit = inmo.nit;
    this.selectedUser.codigoInmobiliaria = inmo.codigo;
    
    this.isDropdownOpen = false;
  }

  openEditModal(user: User | null) {
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

  onRoleChange(newRole: string) {
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

  saveEditUser() { 
    if (this.isCreating) this.createUser(); 
    else this.updateUser(); 
  }

  createUser() {
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

  updateUser() {
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

  openPermissionsModal(user: User) {
    this.selectedUser = { ...user } as User; 
    this.tempPermissions = [...(user.permissions || [])];
    this.showPermissionsModal = true;
  }

  togglePermission(permKey: string) {
    if (this.tempPermissions.includes(permKey)) {
      this.tempPermissions = this.tempPermissions.filter(p => p !== permKey);
    } else {
      this.tempPermissions.push(permKey);
    }
  }

  hasPermission(permKey: string): boolean {
    return this.tempPermissions.includes(permKey);
  }

  savePermissions() {
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

  toggleStatus(user: User) {
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

  changeRole(user: User, newRole: string) {
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