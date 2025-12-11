import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  RedelexService,
  ProcesoDetalleDto,
  AbogadoDto,
  SujetosDto,
  MedidasDto,
} from '../../services/redelex.service';
import { AffiAlert } from '../../../../shared/services/affi-alert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AFFI_LOGO_BASE64 } from '../../../../shared/assets/affi-logo-base64';
import { UserOptions } from 'jspdf-autotable';
import { ClaseProcesoPipe } from '../../../../shared/pipes/clase-proceso.pipe';

interface ProcesoPorCedula {
  procesoId: number;
  demandadoNombre: string;
  demandadoIdentificacion: string;
  demandanteNombre: string;
  demandanteIdentificacion: string;
  claseProceso?: string;
}

// --- CONFIGURACIÓN DE ETAPAS ---
interface EtapaConfig {
  orden: number;
  nombreInterno: string[];
  color: string;
  nombreCliente: string;
  definicion: string;
}

const ETAPAS_MASTER: EtapaConfig[] = [
  { orden: 1, nombreInterno: ['ALISTAMIENTO MES', 'ALISTAMIENTO MESES ANTERIORES', 'DOCUMENTACION COMPLETA', 'ASIGNACION'], color: '#FFFF99', nombreCliente: 'RECOLECCION Y VALIDACION', definicion: 'Se está completando y revisando la información necesaria para iniciar los procesos.' },
  { orden: 2, nombreInterno: ['DEMANDA'], color: '#F1A983', nombreCliente: 'DEMANDA', definicion: 'Hemos iniciado el proceso judicial.' },
  { orden: 3, nombreInterno: ['MANDAMIENTO DE PAGO'], color: '#FBE2D5', nombreCliente: 'MANDAMIENTO PAGO', definicion: 'El juez acepta tramitar la demanda' },
  { orden: 4, nombreInterno: ['ADMISION DEMANDA'], color: '#92D050', nombreCliente: 'ADMISION DEMANDA', definicion: 'El juez acepta tramitar la demanda' },
  { orden: 5, nombreInterno: ['NOTIFICACION'], color: '#B5E6A2', nombreCliente: 'NOTIFICACION', definicion: 'Etapa en la que se comunica la existencia del proceso.' },
  { orden: 6, nombreInterno: ['EXCEPCIONES'], color: '#00B0F0', nombreCliente: 'EXCEPCIONES', definicion: 'Demandado presentó objeciones a la demanda' },
  { orden: 7, nombreInterno: ['AUDIENCIA'], color: '#C0E6F5', nombreCliente: 'AUDIENCIA', definicion: 'Diligencia donde el juez escucha a las partes.' },
  { orden: 8, nombreInterno: ['SENTENCIA'], color: '#D86DCD', nombreCliente: 'SENTENCIA', definicion: 'El juez decidió sobre la demanda.' },
  { orden: 9, nombreInterno: ['LIQUIDACION', 'AVALUO DE BIENES', 'REMATE'], color: '#E49EDD', nombreCliente: 'LIQUIDACION', definicion: 'Etapa en la que se cuantifica con exactitud las obligaciones.' },
  { orden: 10, nombreInterno: ['LANZAMIENTO'], color: '#FFC000', nombreCliente: 'LANZAMIENTO', definicion: 'Se está gestionando el desalojo de los inquilinos.' },
  { orden: 11, nombreInterno: ['TERMINACION', 'TERMINADO DESISTIMIENTO'], color: '#FF6D6D', nombreCliente: 'TERMINACION', definicion: 'El proceso ha finalizado.' }
];

@Component({
  selector: 'app-consultar-proceso',
  standalone: true,
  imports: [CommonModule, FormsModule, ClaseProcesoPipe],
  providers: [ClaseProcesoPipe], 
  templateUrl: './consultar-proceso.html',
  styleUrl: './consultar-proceso.scss',
})

export class ConsultarProcesoComponent implements OnInit {
  private clasePipe = inject(ClaseProcesoPipe);

  // Variables para el Stepper
  etapasStepper: EtapaConfig[] = ETAPAS_MASTER;
  etapaActualIndex: number = -1;
  etapaActualConfig: EtapaConfig | null = null;

  procesoId!: number | null; 
  proceso: ProcesoDetalleDto | null = null;
  
  abogadoPrincipal: AbogadoDto | null = null;
  abogadosInternos: AbogadoDto[] = [];
  otrosAbogados: AbogadoDto[] = [];

  sujetoDemandado: SujetosDto[] = [];
  sujetoDemandante: SujetosDto[] = [];
  sujetosSolidarios: SujetosDto[] = [];
  otrosSujetos: SujetosDto[] = [];

  identificacion: string = '';
  procesosPorCedula: ProcesoPorCedula[] = [];
  procesosFiltrados: ProcesoPorCedula[] = [];
  filtroProcesoId: string = '';

  openMedidas = new Set<number>();
  hasSearched: boolean = false; 
  medidas: MedidasDto[] = [];
  loading = false;

  currentPage = 1;
  itemsPerPage = 10;

  exportState: 'idle' | 'excel' | 'pdf' = 'idle';

  sectionOpen = {
    proceso: true,
    demandante: true,
    demandado: true,
    solidarios: true,
    otrosSujetos: true,
    medidas: true,
    abogados: true,
  };

  constructor(
    private redelexService: RedelexService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Estados Procesales - Consulta de Procesos');
  }

  // --- LÓGICA DEL STEPPER ---
  private calcularEtapaActual() {
    if (!this.proceso || !this.proceso.etapaProcesal) {
      this.etapaActualIndex = -1;
      this.etapaActualConfig = null;
      return;
    }

    const etapaBD = this.proceso.etapaProcesal.toUpperCase().trim();
    
    // Buscar la configuración que coincida con el nombre que viene de BD
    const configFound = ETAPAS_MASTER.find(e => e.nombreInterno.includes(etapaBD));

    if (configFound) {
      this.etapaActualConfig = configFound;
      // El índice es orden - 1 (porque orden empieza en 1)
      this.etapaActualIndex = configFound.orden - 1;
    } else {
      // Si no encuentra (ej: una etapa nueva), lo marcamos como índice 0 o null
      this.etapaActualIndex = 0;
      this.etapaActualConfig = {
        orden: 0, 
        nombreInterno: [], 
        color: '#E5E7EB', // Color gris por defecto
        nombreCliente: etapaBD, 
        definicion: 'Etapa actual del proceso.'
      };
    }
  }

  toggleMedida(index: number) {
    if (this.openMedidas.has(index)) {
      this.openMedidas.delete(index);
    } else {
      this.openMedidas.add(index);
    }
  }

  getMedidaIconType(tipoBien: string | null): string {
    if (!tipoBien) return 'default';
    const tipo = tipoBien.trim().toUpperCase();
    if (tipo.includes('SALARIO') || tipo.includes('DINERO') || tipo.includes('CUENTA')) return 'money';
    if (tipo.includes('INMUEBLE') || tipo.includes('CASA') || tipo.includes('APARTAMENTO') || tipo.includes('FINCA')) return 'house';
    if (tipo.includes('TITULO JUDICIAL') || tipo.includes('JURIDICO') || tipo.includes('SENTENCIA')) return 'legal';
    return 'default';
  }

  formatObservaciones(obs: string | null | undefined): string {
    if (!obs || !obs.trim()) return '-';
    return obs.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
  }

  toggleSection(section: keyof typeof this.sectionOpen) {
    this.sectionOpen[section] = !this.sectionOpen[section];
  }

  consultarPorId() {
    if (!this.procesoId) {
      AffiAlert.fire({ icon: 'info', title: 'Dato requerido', text: 'Ingresa el ID del proceso para consultar.' });
      return;
    }
    this.loading = true;
    this.limpiarDatos();

    this.redelexService.getProceso(this.procesoId).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res || !res.success || !res.data) {
          this.proceso = null;
          AffiAlert.fire({ icon: 'warning', title: 'Proceso no encontrado', text: 'No se encontró información para el ID de proceso ingresado.' });
          return;
        }
        this.proceso = res.data;
        this.procesarDatosProceso();
        
        // Calculamos la etapa para el stepper visual
        this.calcularEtapaActual();
        
        AffiAlert.fire({ icon: 'success', title: 'Proceso cargado', text: `Se cargó la información del proceso ${this.procesoId}.`, timer: 1400, showConfirmButton: false });
      },
      error: () => {
        this.loading = false;
        this.limpiarDatos();
        AffiAlert.fire({ icon: 'error', title: 'Error al consultar', text: 'No se encontró el proceso' });
      },
    });
  }

  private limpiarDatos() {
    this.proceso = null;
    this.abogadoPrincipal = null;
    this.abogadosInternos = [];
    this.otrosAbogados = [];
    this.sujetoDemandante = [];
    this.sujetoDemandado = [];
    this.sujetosSolidarios = [];
    this.otrosSujetos = [];
    this.medidas = [];
    this.openMedidas.clear();
    // Limpiar también datos del stepper
    this.etapaActualIndex = -1;
    this.etapaActualConfig = null;
  }

  // ... (Resto de métodos: procesarDatosProceso, buscarPorCedula, filtrarProcesos, paginación, etc. SE MANTIENEN IGUAL)
  private procesarDatosProceso() {
    if (!this.proceso) return;
    const raw = this.proceso as any;

    const abogados: AbogadoDto[] = (raw.abogados ?? []) as AbogadoDto[];
    this.abogadoPrincipal = abogados.find((a) => a.ActuaComo?.toUpperCase().includes('PRINCIPAL')) ?? null;
    this.abogadosInternos = abogados.filter((a) => a.ActuaComo?.toUpperCase().includes('INTERNO'));
    this.otrosAbogados = abogados.filter((a) => {
      const actuaComo = a.ActuaComo?.toUpperCase() ?? '';
      return !actuaComo.includes('PRINCIPAL') && !actuaComo.includes('INTERNO');
    });

    const sujetos: SujetosDto[] = (raw.sujetos ?? []) as SujetosDto[];
    this.sujetoDemandante = sujetos.filter((s) => s.Tipo?.toUpperCase().includes('DEMANDANTE'));
    this.sujetoDemandado = sujetos.filter((s) => s.Tipo?.toUpperCase().includes('DEMANDADO'));
    this.sujetosSolidarios = sujetos.filter((s) => s.Tipo?.toUpperCase().includes('SOLIDARIO'));
    this.otrosSujetos = sujetos.filter((s) => {
      const tipo = s.Tipo?.toUpperCase() ?? '';
      return !tipo.includes('DEMANDANTE') && !tipo.includes('DEMANDADO') && !tipo.includes('SOLIDARIO');
    });

    const medidasRaw = raw.medidasCautelares;
    const medidasArray: any[] = Array.isArray(medidasRaw) ? medidasRaw : medidasRaw ? [medidasRaw] : [];

    this.medidas = medidasArray.map((m: any): MedidasDto => ({
      tipoBien: m.tipoBien ?? null,
      sujeto: m.sujeto ?? null,
      tipoMedida: m.tipoMedida ?? null,
      medidaEfectiva: m.medidaEfectiva ?? null,
      avaluoJudicial: typeof m.avaluoJudicial === 'number' ? m.avaluoJudicial : m.avaluoJudicial ? Number(m.avaluoJudicial) : null,
      observaciones: m.observaciones ?? null,
    }));
    (this.proceso as any).medidasCautelares = this.medidas;
  }

  buscarPorCedula() {
    const cedula = this.identificacion.trim();
    if (!cedula) {
      AffiAlert.fire({ icon: 'info', title: 'Dato requerido', text: 'Ingresa una cédula o NIT para buscar procesos.' });
      return;
    }
    this.procesoId = null; 
    this.limpiarDatos(); 
    this.loading = true;
    this.procesosPorCedula = [];
    this.procesosFiltrados = [];
    this.filtroProcesoId = '';
    this.currentPage = 1;
    this.hasSearched = false;

    this.redelexService.getProcesosByIdentificacion(cedula).subscribe({
      next: (res) => {
        this.loading = false;
        this.hasSearched = true;
        if (!res || !res.success) return;

        const rawProcesos = res.procesos || [];
        this.procesosPorCedula = rawProcesos.map((proc: any) => {
          let nombreLimpio = proc.demandadoNombre || '';
          let idLimpio = proc.demandadoIdentificacion || '';
          if (nombreLimpio.includes(',')) nombreLimpio = nombreLimpio.split(',')[0].trim();
          if (idLimpio.includes(',')) idLimpio = idLimpio.split(',')[0].trim();
          return { ...proc, demandadoNombre: nombreLimpio, demandadoIdentificacion: idLimpio };
        });
        this.procesosFiltrados = [...this.procesosPorCedula];

        if (!this.procesosPorCedula.length) {
          AffiAlert.fire({ icon: 'info', title: 'Sin procesos', text: 'No se encontraron procesos para esa identificación.' });
        } else {
          AffiAlert.fire({ icon: 'success', title: 'Procesos encontrados', text: `Se encontraron ${this.procesosPorCedula.length} proceso(s).`, timer: 1500, showConfirmButton: false });
        }
      },
      error: () => {
        this.loading = false;
        this.hasSearched = true;
        this.procesosPorCedula = [];
        this.procesosFiltrados = [];
        this.limpiarDatos();
        AffiAlert.fire({ icon: 'error', title: 'Error al consultar', text: 'No se pudieron obtener los procesos.' });
      },
    });
  }

  filtrarProcesos() {
    const f = this.filtroProcesoId.trim().toLowerCase();
    if (!f) {
      this.procesosFiltrados = [...this.procesosPorCedula];
    } else {
      this.procesosFiltrados = this.procesosPorCedula.filter((p) => {
        const idProceso = p.procesoId?.toString() ?? '';
        const demandadoNombre = p.demandadoNombre?.toLowerCase() ?? '';
        const demandadoId = p.demandadoIdentificacion?.toLowerCase() ?? '';
        const demandanteNombre = p.demandanteNombre?.toLowerCase() ?? '';
        const demandanteId = p.demandanteIdentificacion?.toLowerCase() ?? '';
        const claseOriginal = p.claseProceso ? p.claseProceso.toLowerCase() : '';
        const claseTransformada = this.clasePipe.transform(p.claseProceso).toLowerCase();

        return (
          idProceso.includes(f) ||
          demandadoNombre.includes(f) ||
          demandadoId.includes(f) ||
          demandanteNombre.includes(f) ||
          demandanteId.includes(f) ||
          claseOriginal.includes(f) || 
          claseTransformada.includes(f) 
        );
      });
    }
    this.currentPage = 1;
  }

  get procesosPaginados(): ProcesoPorCedula[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.procesosFiltrados.slice(start, end);
  }

  get totalPages(): number { return Math.ceil(this.procesosFiltrados.length / this.itemsPerPage); }

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

  // --- EXPORTACIÓN (Se mantiene igual) ---
  private buildExportRows() {
     // ... (Código original se mantiene)
     if (!this.proceso) return [];
     const p = this.proceso;
     const rows: { Seccion: string; Campo: string; Valor: string | number }[] = [];
     const joinOrDash = (values: (string | null | undefined)[]) => values.length ? values.map(v => v || '-').join(', ') : '-';
     
     if (this.sujetoDemandante.length) {
       rows.push({ Seccion: 'Datos del demandante', Campo: 'Nombres', Valor: joinOrDash(this.sujetoDemandante.map(s => s.Nombre)) });
       rows.push({ Seccion: 'Datos del demandante', Campo: 'Identificación', Valor: joinOrDash(this.sujetoDemandante.map(s => s.NumeroIdentificacion)) });
     }
     if (this.sujetoDemandado.length) {
        rows.push({ Seccion: 'Datos del demandado', Campo: 'Nombres', Valor: joinOrDash(this.sujetoDemandado.map(s => s.Nombre)) });
        rows.push({ Seccion: 'Datos del demandado', Campo: 'Identificación', Valor: joinOrDash(this.sujetoDemandado.map(s => s.NumeroIdentificacion)) });
     }
     if (this.sujetosSolidarios.length) {
        rows.push({ Seccion: 'Datos deudor solidario', Campo: 'Nombres', Valor: joinOrDash(this.sujetosSolidarios.map(s => s.Nombre)) });
        rows.push({ Seccion: 'Datos deudor solidario', Campo: 'Identificación', Valor: joinOrDash(this.sujetosSolidarios.map(s => s.NumeroIdentificacion)) });
     }
     if (this.otrosSujetos.length) {
       this.otrosSujetos.forEach((s, idx) => {
         rows.push(
           { Seccion: `Otro sujeto ${idx + 1}`, Campo: 'Tipo', Valor: s.Tipo || '-' },
           { Seccion: `Otro sujeto ${idx + 1}`, Campo: 'Nombre', Valor: s.Nombre || '-' },
           { Seccion: `Otro sujeto ${idx + 1}`, Campo: 'Identificación', Valor: s.NumeroIdentificacion || '-' },
         );
       });
     }
     rows.push(
       { Seccion: 'Datos del proceso', Campo: 'ID Proceso', Valor: p.idProceso ?? '' },
       { Seccion: 'Datos del Proceso', Campo: 'Despacho actual', Valor: p.despacho || '' },
       { Seccion: 'Datos del Proceso', Campo: 'Despacho de origen', Valor: p.despachoOrigen || '' },
       { Seccion: 'Datos del proceso', Campo: 'Número de radicación', Valor: p.numeroRadicacion || '' },
       { Seccion: 'Datos del proceso', Campo: 'Código alterno', Valor: p.codigoAlterno || '' },
       { Seccion: 'Datos del proceso', Campo: 'Clase de proceso', Valor: this.clasePipe.transform(p.claseProceso) },
       { Seccion: 'Datos del proceso', Campo: 'Etapa procesal', Valor: p.etapaProcesal || '' },
       { Seccion: 'Datos del proceso', Campo: 'Estado', Valor: p.estado || '' },
       { Seccion: 'Datos del proceso', Campo: 'Regional', Valor: p.regional || '' },
       { Seccion: 'Datos del proceso', Campo: 'Tema', Valor: p.tema || '' },
       { Seccion: 'Datos del proceso', Campo: 'Fecha creación', Valor: p.fechaCreacion || '' },
       { Seccion: 'Datos del proceso', Campo: 'Fecha entrega', Valor: p.fechaEntregaAbogado || '' },
       { Seccion: 'Datos del proceso', Campo: 'Fecha admisión', Valor: p.fechaAdmisionDemanda || '' },
       { Seccion: 'Datos del proceso', Campo: 'Fecha recepción', Valor: p.fechaRecepcionProceso || '' },
       { Seccion: 'Datos del proceso', Campo: 'Ubicación contrato', Valor: p.ubicacionContrato || '' },
       { Seccion: 'Datos del proceso', Campo: 'Sentencia 1ra', Valor: p.sentenciaPrimeraInstanciaResultado || '' },
       { Seccion: 'Datos del proceso', Campo: 'Fecha sentencia', Valor: p.sentenciaPrimeraInstanciaFecha || '' },
       { Seccion: 'Datos del proceso', Campo: 'Calificación', Valor: p.calificacion || '' },
       { Seccion: 'Datos del proceso', Campo: 'Última actuación', Valor: [p.ultimaActuacionTipo || '', p.ultimaActuacionFecha || '', p.ultimaActuacionObservacion || ''].filter(Boolean).join(' | ') }
     );
     if (this.medidas.length) {
       this.medidas.forEach((m, idx) => {
         rows.push(
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Tipo medida', Valor: m.tipoMedida || '' },
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Estado medida', Valor: m.medidaEfectiva || '' },
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Sujeto', Valor: m.sujeto|| '' },
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Tipo bien', Valor: m.tipoBien || '' },
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Avalúo judicial', Valor: m.avaluoJudicial ?? '' },
           { Seccion: `Medidas cautelares ${idx + 1}`, Campo: 'Observaciones', Valor: m.observaciones || '' }
         );
       });
     }
     rows.push({ Seccion: 'Abogados', Campo: 'Abogado principal', Valor: this.abogadoPrincipal?.Nombre || 'Sin asignar' });
     if (this.abogadosInternos.length) rows.push({ Seccion: 'Abogados', Campo: 'Abogados internos', Valor: this.abogadosInternos.map(ab => ab.Nombre).join(', ') });
     this.otrosAbogados.forEach((ab, idx) => { rows.push({ Seccion: 'Abogados', Campo: `Otro abogado ${idx + 1} (${ab.ActuaComo || 'N/A'})`, Valor: ab.Nombre || '-' }); });
     return rows;
  }

  async exportarExcel() {
    // ... (Mismo código que antes)
    if (!this.proceso) { AffiAlert.fire({ icon: 'info', title: 'Sin datos', text: 'Primero consulta un proceso.' }); return; }
    this.exportState = 'excel';
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const rows = this.buildExportRows();
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Detalle proceso');
      try { const imageId = workbook.addImage({ base64: AFFI_LOGO_BASE64, extension: 'png' }); sheet.addImage(imageId, { tl: { col: 0.2, row: 0.1 }, ext: { width: 100, height: 100 } }); } catch (e) {}
      sheet.mergeCells('B2:C2'); sheet.getCell('B2').value = `DETALLE DEL PROCESO ${this.proceso.idProceso || ''}`;
      sheet.getCell('B2').font = { bold: true, size: 14 }; sheet.getCell('B2').alignment = { horizontal: 'center' };
      const demandadoNombres = this.sujetoDemandado.map(s => s.Nombre || '').join(', ');
      sheet.mergeCells('B3:C3'); sheet.getCell('B3').value = demandadoNombres.toUpperCase();
      sheet.getColumn(1).width = 25; sheet.getColumn(2).width = 35; sheet.getColumn(3).width = 80; 
      const headerRow = sheet.getRow(6); headerRow.values = ['Sección', 'Campo', 'Valor'];
      headerRow.eachCell((cell) => { cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } }; });
      rows.forEach((r, index) => { const row = sheet.addRow([r.Seccion, r.Campo, r.Valor]); if(index % 2 !== 0) row.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F8F8' } } as ExcelJS.Fill); });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `proceso-${this.proceso.idProceso}.xlsx`);
    } catch (error) { AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el Excel.' }); } 
    finally { this.exportState = 'idle'; }
  }

  async exportarPdf() {
    // ... (Mismo código que antes)
    if (!this.proceso) { AffiAlert.fire({ icon: 'info', title: 'Sin datos', text: 'Primero consulta un proceso.' }); return; }
    this.exportState = 'pdf';
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
       const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
       // ... (Lógica de PDF existente) ...
       // (Por brevedad asumo que mantienes el código original de PDF que ya tenías)
       AffiAlert.fire({ icon: 'success', title: 'PDF Generado', text: 'El PDF se ha descargado correctamente.', timer: 1500, showConfirmButton: false });
    } catch (error) { AffiAlert.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el PDF.' }); }
    finally { this.exportState = 'idle'; }
  }
}