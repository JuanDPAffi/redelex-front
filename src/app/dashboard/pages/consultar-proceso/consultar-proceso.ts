import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RedelexService, ProcesoDetalleDto } from '../../services/redelex';
import { AffiAlert } from '../../../shared/affi-alert';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-consultar-proceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consultar-proceso.html',
  styleUrl: './consultar-proceso.scss'
})
export class ConsultarProcesoComponent {
  procesoId!: number;
  proceso: ProcesoDetalleDto | null = null;

  identificacion: string = '';
  procesosPorCedula: number[] = [];
  procesosFiltrados: number[] = [];
  filtroProcesoId: string = '';

  loading = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 20;

  // 👇 Estado de secciones desplegables
  sectionOpen = {
    proceso: true,
    demandante: true,
    demandado: true,
    medidas: true,
    abogados: true,
  };

    // ========================
  //   EXPORTAR DETALLE
  // ========================

  private buildExportRows() {
    if (!this.proceso) return [];
    const p = this.proceso;

    const rows: { Seccion: string; Campo: string; Valor: string | number }[] = [];

    // --- Datos del proceso ---
    rows.push(
      { Seccion: 'Datos del proceso', Campo: 'ID Proceso', Valor: p.idProceso ?? '' },
      { Seccion: 'Datos del proceso', Campo: 'Número de radicación', Valor: p.numeroRadicacion || '' },
      { Seccion: 'Datos del proceso', Campo: 'Código alterno (Cuenta Quasar)', Valor: p.codigoAlterno || '' },
      { Seccion: 'Datos del proceso', Campo: 'Clase de proceso', Valor: p.claseProceso || '' },
      { Seccion: 'Datos del proceso', Campo: 'Etapa procesal', Valor: p.etapaProcesal || '' },
      { Seccion: 'Datos del proceso', Campo: 'Estado', Valor: p.estado || '' },
      { Seccion: 'Datos del proceso', Campo: 'Regional', Valor: p.regional || '' },
      { Seccion: 'Datos del proceso', Campo: 'Tema (estado del inmueble)', Valor: p.tema || '' },
      { Seccion: 'Datos del proceso', Campo: 'Fecha creación expediente', Valor: p.fechaCreacion || '' },
      { Seccion: 'Datos del proceso', Campo: 'Fecha entrega abogado', Valor: p.fechaEntregaAbogado || '' },
      { Seccion: 'Datos del proceso', Campo: 'Fecha admisión demanda', Valor: p.fechaAdmisionDemanda || '' },
      { Seccion: 'Datos del proceso', Campo: 'Fecha recepción proceso', Valor: p.fechaRecepcionProceso || '' },
      { Seccion: 'Datos del proceso', Campo: 'Ubicación contrato', Valor: p.ubicacionContrato || '' },
      { Seccion: 'Datos del proceso', Campo: 'Sentencia 1ra instancia', Valor: p.sentenciaPrimeraInstanciaResultado || '' },
      { Seccion: 'Datos del proceso', Campo: 'Fecha sentencia 1ra instancia', Valor: p.sentenciaPrimeraInstanciaFecha || '' },
      { Seccion: 'Datos del proceso', Campo: 'Calificación (recuperabilidad)', Valor: p.calificacion || '' },
      {
        Seccion: 'Datos del proceso',
        Campo: 'Última actuación',
        Valor: [
          p.ultimaActuacionTipo || '',
          p.ultimaActuacionFecha || '',
          p.ultimaActuacionObservacion || ''
        ].filter(Boolean).join(' | ')
      }
    );

    // --- Datos del demandante ---
    rows.push(
      { Seccion: 'Datos del demandante', Campo: 'Nombre (Inmobiliaria)', Valor: p.demandanteNombre || '' }
    );

    // --- Datos del demandado ---
    rows.push(
      { Seccion: 'Datos del demandado', Campo: 'Nombre (Inquilino)', Valor: p.demandadoNombre || '' },
      { Seccion: 'Datos del demandado', Campo: 'Identificación', Valor: p.demandadoIdentificacion || '' },
      { Seccion: 'Datos del demandado', Campo: 'Despacho actual', Valor: p.despacho || '' },
      { Seccion: 'Datos del demandado', Campo: 'Despacho de origen', Valor: p.despachoOrigen || '' }
    );

    // --- Medidas cautelares ---
    if (p.medidasCautelares) {
      const m = p.medidasCautelares;
      rows.push(
        { Seccion: 'Medidas cautelares', Campo: 'Id medida', Valor: m.id ?? '' },
        { Seccion: 'Medidas cautelares', Campo: 'Fecha', Valor: m.fecha || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Tipo medida', Valor: m.tipoMedida || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Estado medida', Valor: m.medidaEfectiva || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Sujeto', Valor: m.sujetoNombre || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Tipo bien', Valor: m.tipoBien || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Dirección / detalle', Valor: m.direccion || '' },
        { Seccion: 'Medidas cautelares', Campo: 'Área', Valor: m.area ?? '' },
        { Seccion: 'Medidas cautelares', Campo: 'Avalúo judicial', Valor: m.avaluoJudicial ?? '' },
        { Seccion: 'Medidas cautelares', Campo: 'Observaciones', Valor: m.observaciones || '' }
      );
    }

    // --- Abogados ---
    rows.push(
      { Seccion: 'Abogados', Campo: 'Abogado principal', Valor: p.abogadoPrincipal || 'Sin asignar' }
    );

    if (p.abogadosInternos && p.abogadosInternos.length) {
      const internos = p.abogadosInternos
        .map((ab: any) => ab.Nombre || ab.name || 'Abogado interno')
        .join(', ');

      rows.push({
        Seccion: 'Abogados',
        Campo: 'Abogados internos',
        Valor: internos
      });
    }

    return rows;
  }

  exportarExcel() {
    if (!this.proceso) {
      AffiAlert.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'Primero consulta un proceso para poder exportar.'
      });
      return;
    }

    const rows = this.buildExportRows();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle proceso');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    const fileName = `proceso-${this.proceso.idProceso || 'detalle'}.xlsx`;
    const blob = new Blob([wbout], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    saveAs(blob, fileName);
  }

  exportarPdf() {
    if (!this.proceso) {
      AffiAlert.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'Primero consulta un proceso para poder exportar.'
      });
      return;
    }

    const rows = this.buildExportRows();
    const doc = new jsPDF();

    const p = this.proceso;
    const title = `Detalle del proceso ${p.idProceso ?? ''}`;
    doc.setFontSize(14);
    doc.text(title, 10, 15);

    let y = 25;
    let currentSection = '';

    doc.setFontSize(10);

    rows.forEach((r) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      if (r.Seccion !== currentSection) {
        currentSection = r.Seccion;
        doc.setFont('helvetica', 'bold');
        doc.text(currentSection, 10, y);
        y += 6;
      }

      doc.setFont('helvetica', 'normal');
      const line = `${r.Campo}: ${r.Valor ?? ''}`;
      const splitted = doc.splitTextToSize(line, 190);
      doc.text(splitted, 12, y);
      y += 4 + (splitted.length - 1) * 4;
    });

    const fileName = `proceso-${this.proceso.idProceso || 'detalle'}.pdf`;
    doc.save(fileName);
  }

  constructor(private redelexService: RedelexService) {}

  private resetSections() {
    this.sectionOpen = {
      proceso: true,
      demandante: true,
      demandado: true,
      medidas: true,
      abogados: true,
    };
  }

  toggleSection(section: 'proceso' | 'demandante' | 'demandado' | 'medidas' | 'abogados') {
    this.sectionOpen[section] = !this.sectionOpen[section];
  }

  consultarPorId() {
    if (!this.procesoId) {
      AffiAlert.fire({
        icon: 'info',
        title: 'Dato requerido',
        text: 'Ingresa el ID del proceso para consultar.'
      });
      return;
    }

    this.loading = true;

    this.redelexService.getProceso(this.procesoId).subscribe({
      next: (res) => {
        this.loading = false;

        if (!res || !res.success || !res.data) {
          this.proceso = null;
          AffiAlert.fire({
            icon: 'warning',
            title: 'Proceso no encontrado',
            text: 'No se encontró información para el ID de proceso ingresado.'
          });
          return;
        }

        this.proceso = res.data;
        this.resetSections(); // 👈 cada vez que cargas proceso, abre todas las secciones

        AffiAlert.fire({
          icon: 'success',
          title: 'Proceso cargado',
          text: `Se cargó la información del proceso ${this.procesoId}.`,
          timer: 1400,
          showConfirmButton: false
        });
      },
      error: () => {
        this.loading = false;
        this.proceso = null;

        AffiAlert.fire({
          icon: 'error',
          title: 'Error al consultar',
          text: 'No se encontró el proceso'
        });
      }
    });
  }

  buscarPorCedula() {
    const cedula = this.identificacion.trim();

    if (!cedula) {
      AffiAlert.fire({
        icon: 'info',
        title: 'Dato requerido',
        text: 'Ingresa una cédula o NIT para buscar procesos.'
      });
      return;
    }

    this.loading = true;
    this.procesosPorCedula = [];
    this.procesosFiltrados = [];
    this.proceso = null;
    this.filtroProcesoId = '';
    this.currentPage = 1;

    this.redelexService.getProcesosByIdentificacion(cedula).subscribe({
      next: (res) => {
        this.loading = false;

        if (!res || !res.success) {
          this.procesosPorCedula = [];
          this.procesosFiltrados = [];
          AffiAlert.fire({
            icon: 'error',
            title: 'Error al consultar',
            text: 'No se pudieron obtener los procesos para esa identificación.'
          });
          return;
        }

        this.procesosPorCedula = res.procesos || [];
        this.procesosFiltrados = [...this.procesosPorCedula];

        if (!this.procesosPorCedula.length) {
          AffiAlert.fire({
            icon: 'info',
            title: 'Sin procesos',
            text: 'No se encontraron procesos para esa identificación.'
          });
        } else {
          AffiAlert.fire({
            icon: 'success',
            title: 'Procesos encontrados',
            text: `Se encontraron ${this.procesosPorCedula.length} proceso(s) para la identificación ${cedula}.`,
            timer: 1500,
            showConfirmButton: false
          });
        }
      },
      error: () => {
        this.loading = false;
        this.procesosPorCedula = [];
        this.procesosFiltrados = [];

        AffiAlert.fire({
          icon: 'error',
          title: 'Error al consultar',
          text: 'No se pudieron obtener los procesos para esa identificación.'
        });
      }
    });
  }

  filtrarProcesos() {
    const filtro = this.filtroProcesoId.trim();

    if (!filtro) {
      this.procesosFiltrados = [...this.procesosPorCedula];
    } else {
      this.procesosFiltrados = this.procesosPorCedula.filter((id) =>
        id.toString().includes(filtro)
      );
    }

    this.currentPage = 1;
  }

  get procesosPaginados(): number[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.procesosFiltrados.slice(start, end);
  }

  get totalPages(): number {
    if (!this.procesosFiltrados.length) return 0;
    return Math.ceil(this.procesosFiltrados.length / this.itemsPerPage);
  }

  cambiarPagina(direccion: 'prev' | 'next') {
    if (direccion === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direccion === 'next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  seleccionarProceso(id: number) {
    this.procesoId = id;
    this.consultarPorId();
  }
}
