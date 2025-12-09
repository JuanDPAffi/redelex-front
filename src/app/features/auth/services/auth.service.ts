import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../../environments/environment.prod';

export interface LoginPayload {
  email: string;
  password: string;
}
export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    role?: string;
    nit?: string; 
    codigoInmobiliaria?: string;
}
export interface ResetPasswordPayload {
    email: string;
    token: string;
    password: string;
}

// 1. ACTUALIZAMOS LA INTERFAZ DEL USUARIO
export interface UserData {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    permissions?: string[]; // <--- NUEVO
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}api/auth/`;

  constructor(private http: HttpClient) {}

  refreshUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}profile`).pipe(
      tap((user: any) => {
        this.saveUserData(user); 
      })
    );
  }
  
  register(data: RegisterPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}register`, data);
  }

  login(data: LoginPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}login`, data).pipe(
      tap((response: any) => {
        if (response.user) {
           this.saveUserData(response.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    // Retornamos el Observable de la petición POST
    return this.http.post(`${this.apiUrl}logout`, {}).pipe(
      // finalize asegura que esta función se ejecute cuando el Observable se completa
      // (ya sea con éxito en el backend o por un error de red).
      finalize(() => { 
        this.logoutClientSide();
      })
    );
  }

  // La limpieza de local storage debe ser una función síncrona
  logoutClientSide(): void {
    localStorage.removeItem('redelex_user');
  }

  // 2. GUARDAR DATOS COMPLETOS (ROL + PERMISOS)
  saveUserData(userData: any): void { 
    const normalizedData: UserData = {
      id: userData.id || userData._id,
      name: userData.name || userData.nombre || '',
      email: userData.email || '',
      role: userData.role || userData.rol || 'inmobiliaria',
      permissions: userData.permissions || [] // <--- GUARDAMOS PERMISOS
    };
    localStorage.setItem('redelex_user', JSON.stringify(normalizedData));
  }

  getUserData(): UserData | null {
    const data = localStorage.getItem('redelex_user');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('redelex_user'); 
  }

  // --- NUEVOS HELPERS DE AUTORIZACIÓN ---

  // Verifica si es Super Admin (Pase libre)
  isAdmin(): boolean {
    const user = this.getUserData();
    return user?.role === 'admin';
  }

  // Verifica si tiene un permiso específico (o es admin)
  hasPermission(requiredPermission: string): boolean {
    const user = this.getUserData();
    if (!user) return false;

    // Admin tiene poder absoluto (igual que en backend)
    if (user.role === 'admin') return true;

    // Verificar en el array de permisos
    return user.permissions?.includes(requiredPermission) || false;
  }

  // Verificar si tiene AL MENOS UNO de un array de permisos
  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    const user = this.getUserData();
    if (!user) return false;
    if (user.role === 'admin') return true;

    return permissions.some(p => user.permissions?.includes(p));
  }

  // ... Resto de métodos (activateAccount, resetPassword) se mantienen igual ...
  activateAccount(email: string, token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}activate`, { email, token });
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}request-password-reset`, { email });
  }

  resetPassword(payload: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}reset-password`, payload);
  }
}