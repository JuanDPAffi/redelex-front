import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { FeatherModule } from 'angular-feather';
import { InmobiliariaService, Inmobiliaria, ImportResult } from '../../services/inmobiliaria.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { AuthService } from '../../../auth/services/auth.service';

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
  searchTerm = '';

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

  constructor(
    private inmoService: InmobiliariaService,
    public authService: AuthService // Para verificar permisos en el HTML
  ) {}

  ngOnInit() {
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

  get filteredInmobiliarias() {
    if (!this.searchTerm) return this.inmobiliarias;
    const term = this.searchTerm.toLowerCase();
    return this.inmobiliarias.filter(i => 
      i.nombreInmobiliaria.toLowerCase().includes(term) ||
      i.nit.includes(term) ||
      i.codigo.toLowerCase().includes(term)
    );
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
    // Validar extensión simple
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
          this.loadData(); // Recargar tabla de fondo
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