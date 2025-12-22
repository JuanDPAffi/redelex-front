import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProcesoResumenDto {
  procesoId: number;
  demandadoNombre: string;
  demandadoIdentificacion: string;
  demandanteNombre: string;
  demandanteIdentificacion: string;
}

export interface ProcesosPorIdentificacionResponse {
  success: boolean;
  identificacion: string;
  procesos: ProcesoResumenDto[];
}

export interface ActuacionDto {
  fecha: string;
  observacion: string;
  etapa: string;
  tipo: string;
  cuaderno: string;
}

export interface ProcesoDetalleDto {
  idProceso: number;
  numeroRadicacion: string | null;
  codigoAlterno: string | null;
  claseProceso: string | null;
  etapaProcesal: string | null;
  estado: string | null;
  regional: string | null;
  tema: string | null;
  sujetos: SujetosDto[];
  despacho: string | null;
  despachoOrigen: string | null;
  fechaAdmisionDemanda: string;
  fechaCreacion: string;
  fechaEntregaAbogado: string;
  fechaRecepcionProceso: string;
  ubicacionContrato: string | null;
  fechaAceptacionSubrogacion: string;
  fechaPresentacionSubrogacion: string;
  motivoNoSubrogacion: string | null;
  calificacion: string | null;
  sentenciaPrimeraInstanciaResultado: string | null;
  sentenciaPrimeraInstanciaFecha: string | null;
  medidasCautelares: MedidasDto[];
  ultimaActuacionFecha: string;
  ultimaActuacionTipo: string | null;
  ultimaActuacionObservacion: string | null;
  actuacionesRecientes?: ActuacionDto[];
  abogados: AbogadoDto[];
}

export interface MedidasDto {
    tipoBien: string | null;
    sujeto: string | null;
    descripcion: string | null;
    tipoMedida: string | null;
    medidaEfectiva: string | null;
    avaluoJudicial: number;
    observaciones: string | null;
    identificacionSujeto: string | null;
    area: string | null;
    fecha: string | null;
}

export interface AbogadoDto {
  ActuaComo: string;
  Nombre: string;
}

export interface SujetosDto {
  Tipo: string;
  Nombre: string;
  TipoIdentificacion: string;
  NumeroIdentificacion: string;
}

export interface InformeInmobiliaria {
  idProceso: number;
  claseProceso: string;
  demandadoIdentificacion: string;
  demandadoNombre: string;
  demandanteIdentificacion: string;
  demandanteNombre: string;
  codigoAlterno: string;
  etapaProcesal: string;
  fechaRecepcionProceso: string;
  sentenciaPrimeraInstancia: string;
  despacho: string;
  numeroRadicacion: string;
  ciudadInmueble: string | null;
}

export interface InformeResponse {
  success: boolean;
  count: number;
  data: InformeInmobiliaria[];
}


@Injectable({
  providedIn: 'root',
})
export class RedelexService {
  private apiUrl = `${environment.apiUrl}api/redelex`;

  constructor(private http: HttpClient) {}

  getMisProcesos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-procesos`);
  }

  getProcesoDetalleById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/proceso/${id}`);
  }

  getProceso(id: number): Observable<{ success: boolean; data: ProcesoDetalleDto | null }> {
    return this.http.get<{ success: boolean; data: ProcesoDetalleDto | null }>(
      `${this.apiUrl}/proceso/${id}`
    );
  }

  getProcesosByIdentificacion(identificacion: string): Observable<ProcesosPorIdentificacionResponse> {
    return this.http.get<ProcesosPorIdentificacionResponse>(
      `${this.apiUrl}/procesos-por-identificacion/${identificacion}`
    );
  }

  getInformeInmobiliaria(informeId: number): Observable<InformeResponse> {
    return this.http.get<InformeResponse>(`${this.apiUrl}/informe-inmobiliaria/${informeId}`);
  }
}
