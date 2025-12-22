import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TicketMetadata {
  procesoId?: number | string;
  radicado?: string;
  despacho?: string;
  etapa?: string;
}

@Injectable({
  providedIn: 'root'
})

export class SupportService {
  private apiUrl = `${environment.apiUrl}api/support/ticket`;

  constructor(private http: HttpClient) {}

  createTicket(subject: string, content: string, metadata?: TicketMetadata) {
    return this.http.post(this.apiUrl, { 
      subject, 
      content,
      metadata
    });
  }
}