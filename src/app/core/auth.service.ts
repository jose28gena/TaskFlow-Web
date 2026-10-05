import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE } from './config';
import { AuthResponse } from './models';

interface Session {
  email: string;
  token: string;
  expiresAt: string;
}

const STORAGE_KEY = 'taskflow.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(this.restore());

  readonly email = computed(() => this.session()?.email ?? null);

  /** Token vigente, o null si no hay sesión o ya expiró. */
  token(): string | null {
    const s = this.session();
    return s && new Date(s.expiresAt).getTime() > Date.now() ? s.token : null;
  }

  isAuthenticated(): boolean {
    return this.token() !== null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(tap((res) => this.store(email, res)));
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, { email, password })
      .pipe(tap((res) => this.store(email, res)));
  }

  logout(): void {
    this.session.set(null);
    this.write(null);
    void this.router.navigate(['/login']);
  }

  private store(email: string, res: AuthResponse): void {
    const session: Session = { email, token: res.token, expiresAt: res.expiresAt };
    this.session.set(session);
    this.write(session);
  }

  // El almacenamiento puede no estar disponible (modo privado, políticas del navegador): nunca debe romper la app.
  // Nota de seguridad: guardar el token en el navegador lo expone a XSS; en producción es preferible una cookie httpOnly.
  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  private write(session: Session | null): void {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin almacenamiento: la sesión vive solo en memoria */
    }
  }
}
