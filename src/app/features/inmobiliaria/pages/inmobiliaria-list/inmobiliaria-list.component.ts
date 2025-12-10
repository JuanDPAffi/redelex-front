import { Component, OnInit, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FeatherModule } from 'angular-feather';
import { InmobiliariaService, Inmobiliaria, ImportResult } from '../../services/inmobiliaria.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { AuthService } from '../../../auth/services/auth.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-inmobiliaria-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherModule],
  templateUrl: './inmobiliaria-list.component.html',
  styleUrls: ['./inmobiliaria-list.component.scss']
})
export class InmobiliariaListComponent implements OnInit {
  inmobiliarias: Inmobiliaria[] = [];
  loading = true;

  // Estados de Modales
  showEditModal = false;
  showImportModal = false;
  selectedInmo: Partial<Inmobiliaria> = {};

  // Estados de Importación
  currentFile: File | null = null;
  uploadProgress = 0;
  isUploading = false;
  importResult: ImportResult | null = null;
  dragOver = false;

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // --- FILTROS AVANZADOS ---
  filtros = {
    busquedaGeneral: '',
    nit: '',
    codigo: '',
    nombreInmobiliaria: '',
    estado: '',
    tieneUsuario: ''
  };

  private titleService = inject(Title);


  // Lista única de estados
  listaEstados = ['Activo', 'Inactivo'];
  listaTieneUsuario = ['Con Usuario', 'Sin Usuario'];

  // Control de dropdowns
  activeDropdown: string | null = null;

  constructor(
    private inmoService: InmobiliariaService,
    public authService: AuthService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Estados Procesales - Inmobiliarias');
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.inmoService.getAll().subscribe({
      next: (data) => {
        this.inmobiliarias = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las inmobiliarias.' });
      }
    });
  }

  // --- FILTROS ---
  get filteredInmobiliarias() {
    return this.inmobiliarias.filter(inmo => {
      // Búsqueda General
      if (this.filtros.busquedaGeneral) {
        const term = this.filtros.busquedaGeneral.toLowerCase();
        const match = 
          inmo.nombreInmobiliaria.toLowerCase().includes(term) ||
          inmo.nit.includes(term) ||
          inmo.codigo.toLowerCase().includes(term) ||
          inmo.emailRegistrado?.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Filtro por NIT
      if (this.filtros.nit && !inmo.nit.includes(this.filtros.nit)) return false;

      // Filtro por Código
      if (this.filtros.codigo && !inmo.codigo.toLowerCase().includes(this.filtros.codigo.toLowerCase())) return false;

      // Filtro por Nombre Inmobiliaria
      if (this.filtros.nombreInmobiliaria && !inmo.nombreInmobiliaria.toLowerCase().includes(this.filtros.nombreInmobiliaria.toLowerCase())) return false;

      // Filtro por Estado
      if (this.filtros.estado) {
        const estadoInmo = inmo.isActive ? 'Activo' : 'Inactivo';
        if (estadoInmo !== this.filtros.estado) return false;
      }

      // Filtro por Tiene Usuario
      if (this.filtros.tieneUsuario) {
        const tieneUsuario = inmo.emailRegistrado ? 'Con Usuario' : 'Sin Usuario';
        if (tieneUsuario !== this.filtros.tieneUsuario) return false;
      }

      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      busquedaGeneral: '',
      nit: '',
      codigo: '',
      nombreInmobiliaria: '',
      estado: '',
      tieneUsuario: ''
    };
    this.currentPage = 1;
  }

  // --- PAGINACIÓN ---
  get paginatedInmobiliarias() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredInmobiliarias.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredInmobiliarias.length / this.itemsPerPage);
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

  selectFilterOption(filterKey: 'estado' | 'tieneUsuario', value: string) {
    this.filtros[filterKey] = value;
    this.activeDropdown = null;
    this.currentPage = 1;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeDropdown = null;
    }
  }

  // --- LÓGICA DE IMPORTACIÓN ---

  openImportModal() {
    this.showImportModal = true;
    this.resetImportState();
  }

  resetImportState() {
    this.currentFile = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.importResult = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.validateAndSetFile(file);
  }

  // Drag & Drop Handlers
  onDragOver(e: Event) { e.preventDefault(); e.stopPropagation(); this.dragOver = true; }
  onDragLeave(e: Event) { e.preventDefault(); e.stopPropagation(); this.dragOver = false; }
  onDrop(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = false;
    const file = e.dataTransfer.files[0];
    if (file) this.validateAndSetFile(file);
  }

  validateAndSetFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      AffiAlert.fire({ icon: 'warning', title: 'Archivo inválido', text: 'Solo se permiten archivos Excel (.xlsx, .xls)' });
      return;
    }
    this.currentFile = file;
  }

  uploadFile() {
    if (!this.currentFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    this.inmoService.importInmobiliarias(this.currentFile).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          this.isUploading = false;
          this.importResult = event.body as ImportResult;
          this.loadData();
          AffiAlert.fire({ 
            icon: 'success', 
            title: 'Importación Exitosa', 
            text: 'La base de datos ha sido sincronizada.',
            timer: 2000,
            showConfirmButton: false
          });
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadProgress = 0;
        const msg = err.error?.message || 'Error al procesar el archivo.';
        AffiAlert.fire({ icon: 'error', title: 'Error de Importación', text: msg });
      }
    });
  }

  // --- CRUD BÁSICO (Editar / Status) ---

  openEditModal(inmo: Inmobiliaria) {
    this.selectedInmo = { ...inmo };
    this.showEditModal = true;
  }

  saveEdit() {
    if (!this.selectedInmo._id) return;
    this.inmoService.update(this.selectedInmo._id, this.selectedInmo).subscribe({
      next: (updated) => {
        const index = this.inmobiliarias.findIndex(i => i._id === updated._id);
        if (index !== -1) this.inmobiliarias[index] = updated;
        this.showEditModal = false;
        AffiAlert.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
      },
      error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' })
    });
  }

  toggleStatus(inmo: Inmobiliaria) {
    AffiAlert.fire({
      title: '¿Estás seguro?',
      text: `Vas a ${inmo.isActive ? 'desactivar' : 'activar'} la inmobiliaria ${inmo.nombreInmobiliaria}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.inmoService.toggleStatus(inmo._id).subscribe({
          next: () => {
            inmo.isActive = !inmo.isActive;
            AffiAlert.fire({ icon: 'success', title: 'Estado actualizado', timer: 1500, showConfirmButton: false });
          },
          error: () => AffiAlert.fire({ icon: 'error', title: 'Error', text: 'Fallo al cambiar estado.' })
        });
      }
    });
  }

  closeModals() {
    this.showEditModal = false;
    this.showImportModal = false;
    this.resetImportState();
  }
}