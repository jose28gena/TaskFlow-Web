import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE } from './config';

/**
 * Adjunta el token a las llamadas a la API (salvo login/registro) y cierra la sesión
 * si el backend responde 401 a una llamada autenticada.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isApiCall = req.url.startsWith(API_BASE);
  const isAuthCall = req.url.startsWith(`${API_BASE}/auth/`);
  const token = auth.token();

  const authorized =
    isApiCall && !isAuthCall && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiCall && !isAuthCall) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
