import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core'; // 👈 Agregamos HostListener y ElementRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RedelexService, InformeInmobiliaria } from '../../services/redelex.service';
import * as ExcelJS from 'exceljs';

@Component({
  selector: 'app-informe-inmobiliaria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informe-inmobiliaria.component.html',
  styleUrls: ['./informe-inmobiliaria.component.scss']
})
export class InformeInmobiliariaComponent implements OnInit {
  private redelexService = inject(RedelexService);
  private elementRef = inject(ElementRef); // Para detectar clics fuera
  
  readonly INFORME_ID = 5626;

  loading = true;
  error = '';
  
  rawData: InformeInmobiliaria[] = [];
  filteredData: InformeInmobiliaria[] = [];

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50, 100];
  
  // --- EXPORTACIÓN ---
  showExportModal = false;
  exportColumns = [
    { key: 'idProceso', label: 'ID Proceso', selected: true },
    { key: 'claseProceso', label: 'Clase Proceso', selected: true },
    { key: 'numeroRadicacion', label: 'Radicado', selected: true },
    { key: 'demandadoNombre', label: 'Demandado Nombre', selected: true },
    { key: 'demandadoIdentificacion', label: 'Demandado ID', selected: true },
    { key: 'demandanteNombre', label: 'Demandante Nombre', selected: true },
    { key: 'demandanteIdentificacion', label: 'Demandante ID', selected: true },
    { key: 'despacho', label: 'Despacho', selected: true },
    { key: 'etapaProcesal', label: 'Etapa', selected: true },
    { key: 'sentenciaPrimeraInstancia', label: 'Sentencia 1ra', selected: true },
    { key: 'fechaRecepcionProceso', label: 'Fecha Recepción', selected: true },
    { key: 'ciudadInmueble', label: 'Ciudad', selected: true },
  ];

  // Listas Maestras
  listaEtapas: string[] = [];
  listaClaseProceso: string[] = [];
  listaDespachos: string[] = [];

  // Filtros
  filtros = {
    busquedaGeneral: '', 
    claseProceso: '',
    identificacion: '',
    nombre: '',
    despacho: '',
    etapa: ''
  };

  // --- LÓGICA DE DROPDOWNS PERSONALIZADOS ---
  activeDropdown: string | null = null; // 'clase', 'etapa', 'despacho' o null
  
  // Búsqueda interna de cada dropdown
  searchClase = '';
  searchEtapa = '';
  searchDespacho = '';

  // Listas filtradas para mostrar en el dropdown
  get filteredClaseList() {
    return this.listaClaseProceso.filter(c => c.toLowerCase().includes(this.searchClase.toLowerCase()));
  }
  get filteredEtapaList() {
    return this.listaEtapas.filter(e => e.toLowerCase().includes(this.searchEtapa.toLowerCase()));
  }
  get filteredDespachoList() {
    return this.listaDespachos.filter(d => d.toLowerCase().includes(this.searchDespacho.toLowerCase()));
  }

  mostrarFiltros = true;

  ngOnInit(): void {
    this.loadInforme();
  }

  // Cierra los dropdowns si se hace clic fuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeDropdown = null;
    }
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    if (this.activeDropdown === name) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = name;
      this.searchClase = '';
      this.searchEtapa = '';
      this.searchDespacho = '';
    }
  }

  selectPageSize(size: number) {
    this.itemsPerPage = size;
    this.changeItemsPerPage(); // Llama a tu método existente que resetea a página 1
    this.activeDropdown = null; // Cierra el menú
  }

  selectOption(field: 'claseProceso' | 'etapa' | 'despacho', value: string) {
    this.filtros[field] = value;
    this.activeDropdown = null;
    this.applyFilters();
  }

  loadInforme() {
    this.loading = true;
    this.redelexService.getInformeInmobiliaria(this.INFORME_ID).subscribe({
      next: (response) => {
        this.rawData = response.data;
        this.filteredData = response.data;
        this.extraerListasUnicas();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando informe', err);
        this.error = 'No se pudo cargar la información del informe.';
        this.loading = false;
      }
    });
  }

  extraerListasUnicas() {
    const etapasSet = new Set<string>();
    const despachosSet = new Set<string>();
    const clasesSet = new Set<string>();

    this.rawData.forEach(item => {
      if (item.etapaProcesal) etapasSet.add(item.etapaProcesal);
      if (item.despacho) despachosSet.add(item.despacho);
      if (item.claseProceso) clasesSet.add(item.claseProceso);
    });

    this.listaEtapas = Array.from(etapasSet).sort();
    this.listaDespachos = Array.from(despachosSet).sort();
    this.listaClaseProceso = Array.from(clasesSet).sort();
  }

  applyFilters() {
    this.currentPage = 1;
    
    this.filteredData = this.rawData.filter(item => {
      // Filtro General
      if (this.filtros.busquedaGeneral) {
        const term = this.filtros.busquedaGeneral.toLowerCase();
        const generalMatch = 
          item.demandadoNombre?.toLowerCase().includes(term) ||
          item.demandanteNombre?.toLowerCase().includes(term) ||
          item.demandadoIdentificacion?.includes(term) ||
          item.demandanteIdentificacion?.includes(term) ||
          item.numeroRadicacion?.includes(term) ||
          item.despacho?.toLowerCase().includes(term) ||
          item.ciudadInmueble?.toLowerCase().includes(term) ||
          item.etapaProcesal?.toLowerCase().includes(term) ||
          item.claseProceso?.toLowerCase().includes(term);

        if (!generalMatch) return false;
      }

      // Filtros Específicos
      if (this.filtros.identificacion) {
        const termId = this.filtros.identificacion.trim();
        if (!(item.demandadoIdentificacion?.includes(termId) || item.demandanteIdentificacion?.includes(termId))) return false;
      }
      if (this.filtros.nombre) {
        const termNombre = this.filtros.nombre.toLowerCase().trim();
        if (!(item.demandadoNombre?.toLowerCase().includes(termNombre) || item.demandanteNombre?.toLowerCase().includes(termNombre))) return false;
      }
      
      // Filtros Dropdown (Exactos)
      if (this.filtros.etapa && item.etapaProcesal !== this.filtros.etapa) return false;
      if (this.filtros.despacho && item.despacho !== this.filtros.despacho) return false;
      if (this.filtros.claseProceso && item.claseProceso !== this.filtros.claseProceso) return false;

      return true;
    });
  }

  limpiarFiltros() {
    this.filtros = {
      busquedaGeneral: '',
      claseProceso: '',
      identificacion: '',
      nombre: '',
      despacho: '',
      etapa: ''
    };
    this.applyFilters();
  }

  toggleFiltros() { this.mostrarFiltros = !this.mostrarFiltros; }
  
  // PAGINACIÓN
  get paginatedData(): InformeInmobiliaria[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }
  get totalPages(): number { return Math.ceil(this.filteredData.length / this.itemsPerPage); }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  changeItemsPerPage() { this.currentPage = 1; }

  // EXPORTACIÓN
  openExportModal() { this.showExportModal = true; }
  closeExportModal() { this.showExportModal = false; }
  toggleColumn(colKey: string) {
    const col = this.exportColumns.find(c => c.key === colKey);
    if (col) col.selected = !col.selected;
  }
  selectAllColumns(select: boolean) { this.exportColumns.forEach(c => c.selected = select); }

  async exportToExcel() {
    const activeColumns = this.exportColumns.filter(c => c.selected);
    if (activeColumns.length === 0) { alert('Selecciona al menos una columna'); return; }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informe Inmobiliaria');
    worksheet.columns = activeColumns.map(col => ({ header: col.label, key: col.key, width: 20 }));
    worksheet.addRows(this.filteredData);
    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Informe_Inmobiliaria_${new Date().getTime()}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.closeExportModal();
  }
}