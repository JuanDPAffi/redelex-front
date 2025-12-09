import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private apiUrl = `${environment.apiUrl}api/support`;

  constructor(private http: HttpClient) {}

  createTicket(subject: string, content: string) {
    return this.http.post(`${this.apiUrl}/ticket`, { subject, content });
  }
}