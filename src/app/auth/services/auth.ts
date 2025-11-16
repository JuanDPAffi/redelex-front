import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
}

export interface UserData {
  id?: string;
  nombre?: string;
  name?: string;
  email?: string;
  rol?: string;
  role?: string;
}

// Respuesta típica de /login y /register
export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://redelex-ayhxghaje6c3gkaz.eastus-01.azurewebsites.net/api/auth';

  private readonly ACCESS_TOKEN_KEY = 'redelex_token';
  private readonly REFRESH_TOKEN_KEY = 'redelex_refresh_token';
  private readonly USER_KEY = 'redelex_user';

  constructor(private http: HttpClient) {}

  // -----------------------------
  // AUTH
  // -----------------------------
  register(data: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data);
  }

  login(data: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data);
  }

  // -----------------------------
  // TOKEN
  // -----------------------------
  saveToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  saveRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    this.saveToken(accessToken);
    this.saveRefreshToken(refreshToken);
  }

  // -----------------------------
  // USER DATA
  // -----------------------------
  saveUserData(userData: UserData): void {
    const normalizedData = {
      id: userData.id,
      nombre: userData.nombre || userData.name || '',
      email: userData.email || '',
      rol: userData.rol || userData.role || 'Usuario',
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedData));
  }

  getUserData(): UserData | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error al parsear datos de usuario:', error);
      return null;
    }
  }

  // -----------------------------
  // LOGOUT
  // -----------------------------

  /** Llama al backend para invalidar la sesión actual */
  private logoutApi(token: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,   // 👈 importante el Bearer
        },
      }
    );
  }

  /** Limpia todo lo local (tokens + usuario) */
  private logoutLocal(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Logout completo:
   * - Limpia inmediatamente el estado local
   * - Notifica al backend (best effort) para invalidar la sesión
   */
  logout(): void {
    const token = this.getToken();

    // 1️⃣ Limpio local de una vez
    this.logoutLocal();

    // 2️⃣ Si no había token, no hay nada que avisar al backend
    if (!token) return;

    // 3️⃣ Aviso al backend en segundo plano
    this.logoutApi(token).subscribe({
      next: () => {
        // nada más que hacer
      },
      error: (err) => {
        console.error('Error en logout API:', err);
        // ya estás desconectado en el front, no rompemos UX
      },
    });
  }

  // -----------------------------
  // PASSWORD RESET
  // -----------------------------
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { email });
  }

  resetPassword(payload: ResetPasswordPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, payload);
  }
}
