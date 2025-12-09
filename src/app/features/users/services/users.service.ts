import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserData, RegisterPayload } from '../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

// --- CORRECCIÓN AQUÍ ---
export interface User extends UserData {
  _id: string;
  isActive: boolean;
  createdAt: string;
  loginAttempts: number;
  nombreInmobiliaria?: string;
  nit?: string;
  codigoInmobiliaria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}api/users`;
  private authUrl = `${environment.apiUrl}api/auth`;

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

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }

createUser(data: RegisterPayload): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, data);
  }
}