import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error HTTP del backend (ProblemDetails / validación de ASP.NET) en un mensaje legible. */
export function describeError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Ocurrió un error inesperado.';
  }

  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.';
  }

  // En errores del servidor no se muestra el detalle: puede contener información interna.
  if (error.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.';

  const body = error.error as
    | { errors?: Record<string, string[]>; detail?: string; title?: string }
    | null
    | undefined;

  const firstValidation = body?.errors ? Object.values(body.errors).flat()[0] : undefined;
  if (firstValidation) return firstValidation;
  if (body?.detail) return body.detail;
  if (error.status === 401) return 'Tu sesión no es válida. Inicia sesión de nuevo.';

  return body?.title ?? 'No se pudo completar la operación.';
}
