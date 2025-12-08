import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserData } from '../../auth/services/auth.service';

// --- CORRECCIÓN AQUÍ ---
export interface User extends UserData {
  _id: string;
  isActive: boolean;
  createdAt: string;
  loginAttempts: number;
  nombreInmobiliaria?: string;
  nit?: string;                // <--- Faltaba esto
  codigoInmobiliaria?: string; // Agreguémoslo por si acaso
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}api/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, {});
  }

  changeRole(id: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}/role`, { role });
  }

  updatePermissions(id: string, permissions: string[]): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}/permissions`, { permissions });
  }
}