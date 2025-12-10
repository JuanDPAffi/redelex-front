import { HostListener, ElementRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../services/users.service';
import { InmobiliariaLookupService, InmobiliariaLookup } from '../../services/inmobiliaria-lockup.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { FeatherModule } from 'angular-feather';
import { RegisterPayload } from '../../../auth/services/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherModule],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  private titleService = inject(Title);
  users: User[] = [];
  filteredUsers: User[] = []; // Array filtrado
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

  readonly DEFAULT_PERMISSIONS: Record<string, string[]> = {
    'admin': [],
    'affi': ['reports:view', 'utils:export', 'procesos:view_all'],
    'inmobiliaria': ['procesos:view_own', 'utils:export']
  };

  // --- FILTROS ---
  // Centralizamos todo aquí para que coincida con el HTML
  filtros = {
    busquedaGeneral: '',
    rol: '',
    estado: '',
    nit: '',
    nombreInmobiliaria: ''
  };

  listaRoles: string[] = [];
  listaEstados = ['Activo', 'Inactivo'];
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
    this.titleService.setTitle('Estados Procesales - Usuarios');
    this.loadUsers();
    this.loadInmobiliarias(); 
  }

  loadUsers() {
    this.loading = true;
    this.usersService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.extraerListasUnicas();
        this.applyFilters(); // Inicializar lista
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

  hasCustomPermissions(user: User): boolean {
    if (!user.role) return false;
    
    const defaults = this.DEFAULT_PERMISSIONS[user.role] || [];
    const current = user.permissions || [];

    // Si la cantidad es diferente, definitivamente son personalizados
    if (current.length !== defaults.length) return true;

    // Si la cantidad es igual, comparamos el contenido
    // Ordenamos ambos arrays para asegurar que la comparación sea exacta
    const sortedDefaults = [...defaults].sort();
    const sortedCurrent = [...current].sort();

    // Convertimos a string para comparar fácil
    return JSON.stringify(sortedDefaults) !== JSON.stringify(sortedCurrent);
  }

  // --- MOTOR DE FILTRADO ---
  applyFilters() {
    let data = this.users;

    // 1. Búsqueda General
    if (this.filtros.busquedaGeneral) {
      const term = this.filtros.busquedaGeneral.toLowerCase();
      data = data.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.nit?.includes(term) ||
        user.nombreInmobiliaria?.toLowerCase().includes(term)
      );
    }

    // 2. Filtro por Rol (por Label)
    if (this.filtros.rol) {
      const roleLabel = (u: User) => this.availableRoles.find(r => r.value === u.role)?.label || u.role;
      data = data.filter(user => roleLabel(user) === this.filtros.rol);
    }

    // 3. Filtro por Estado
    if (this.filtros.estado) {
      const estadoUsuario = (u: User) => u.isActive ? 'Activo' : 'Inactivo';
      data = data.filter(user => estadoUsuario(user) === this.filtros.estado);
    }

    // 4. Filtro por NIT
    if (this.filtros.nit) {
      data = data.filter(user => user.nit?.includes(this.filtros.nit));
    }

    // 5. Filtro por Nombre Inmobiliaria
    if (this.filtros.nombreInmobiliaria) {
      const termInmo = this.filtros.nombreInmobiliaria.toLowerCase();
      data = data.filter(user => user.nombreInmobiliaria?.toLowerCase().includes(termInmo));
    }

    this.filteredUsers = data;
    this.currentPage = 1; // IMPORTANTE: Volver a pag 1 al filtrar
  }

  limpiarFiltros() {
    this.filtros = {
      busquedaGeneral: '',
      rol: '',
      estado: '',
      nit: '',
      nombreInmobiliaria: ''
    };
    this.applyFilters();
  }

  // --- PAGINACIÓN ---
  get paginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() { return Math.ceil(this.filteredUsers.length / this.itemsPerPage) || 1; }
  
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  
  selectPageSize(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.activeDropdown = null;
  }

  // --- DROPDOWNS UI ---
  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  selectFilterOption(filterKey: 'rol' | 'estado', value: string) {
    this.filtros[filterKey] = value;
    this.activeDropdown = null;
    this.applyFilters(); // Aplicar filtro al seleccionar opción
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeDropdown = null;
      this.isDropdownOpen = false;
    }
  }

  // --- MODAL HELPERS ---
  get filteredInmobiliarias() { 
    if (this.selectedUser.role !== 'inmobiliaria') return [];
    return this.inmobiliarias.filter(inmo => {
      if (!inmo.emailRegistrado) return true;
      if (!this.isCreating && inmo.nit === this.selectedUser.nit) return true;
      return false;
    });
  }
  
  get searchableInmobiliarias() {
    const term = this.inmoSearchTerm.toLowerCase();
    return this.filteredInmobiliarias.filter(inmo => 
      inmo.nombreInmobiliaria.toLowerCase().includes(term) || inmo.nit.includes(term)
    );
  }

  toggleDropdownInmo() {
    if (this.selectedUser.role === 'inmobiliaria' || this.isCreating) {
      this.isDropdownOpen = !this.isDropdownOpen;
    }
    if (this.isDropdownOpen) this.inmoSearchTerm = '';
  }

  selectInmobiliaria(inmo: InmobiliariaLookup) {
    this.selectedInmoId = inmo._id;
    this.selectedUser.nombreInmobiliaria = inmo.nombreInmobiliaria;
    this.selectedUser.nit = inmo.nit;
    this.selectedUser.codigoInmobiliaria = inmo.codigo;
    this.isDropdownOpen = false; 
  }

  // --- ACCIONES CRUD ---
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
      this.selectedUser = { role: 'inmobiliaria', isActive: true, name: '', email: '', nit: '', codigoInmobiliaria: '', nombreInmobiliaria: '' };
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
      this.selectedUser.nombreInmobiliaria = 'AFFI';
    } else {
      this.selectedUser.nit = '';
      this.selectedUser.codigoInmobiliaria = '';
      this.selectedUser.nombreInmobiliaria = '';
    }
  }

  saveEditUser() { if (this.isCreating) this.createUser(); else this.updateUser(); }

  createUser() { 
    if (!this.selectedUser.email || !this.userPassword || !this.selectedUser.name) {
      AffiAlert.fire({ icon: 'warning', title: 'Faltan datos', text: 'Campos obligatorios vacíos.' });
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
          Object.assign(this.users[index], updatedUser);
        }
        this.applyFilters();
        this.showEditModal = false;
        AffiAlert.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
      },
      error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' })
    });
  }

  // --- LÓGICA DE ROLES MEJORADA (CON ALERTA) ---
  changeRole(user: User, newRole: string) {
    if (user.role === newRole) return;

    const roleLabel = this.availableRoles.find(r => r.value === newRole)?.label || newRole;

    AffiAlert.fire({
      title: '¿Cambiar rol de usuario?',
      text: `Estás a punto de cambiar el rol de ${user.name} a ${roleLabel}. Esto reiniciará sus permisos personalizados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.changeRole(user._id, newRole).subscribe({
          next: (updated) => {
            const index = this.users.findIndex(u => u._id === updated._id);
            if (index !== -1) {
              Object.assign(this.users[index], updated);
            }
            this.applyFilters();
            AffiAlert.fire({ icon: 'success', title: 'Rol actualizado', text: 'Permisos reiniciados.', timer: 2000, showConfirmButton: false });
          },
          error: () => {
            AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el rol.' });
            this.loadUsers(); 
          }
        });
      } else {
        this.applyFilters(); // Revertir select visualmente
      }
    });
  }

  toggleStatus(user: User) {
    const accion = user.isActive ? 'desactivar' : 'activar';
    AffiAlert.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de ${accion} el acceso de ${user.name}.`,
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
            // No requerimos applyFilters obligatorio aqui a menos que filtres por estado, pero es buena practica
            this.applyFilters(); 
            AffiAlert.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
          },
          error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'Fallo al cambiar estado.' })
        });
      }
    });
  }

  // --- PERMISOS ---
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
}