import { HttpErrorResponse } from '@angular/common/http';
import { describeError } from './api-error';

const http = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('describeError', () => {
  it('avisa cuando no hay conexión con el servidor', () => {
    expect(describeError(http(0))).toContain('No se pudo conectar');
  });

  it('prefiere el primer mensaje de validación del backend', () => {
    const error = http(400, { errors: { Title: ['El título es obligatorio.'], Email: ['Correo inválido.'] } });

    expect(describeError(error)).toBe('El título es obligatorio.');
  });

  it('usa el detalle de ProblemDetails cuando existe', () => {
    expect(describeError(http(409, { title: 'Conflicto', detail: 'Ya existe un usuario con ese correo.' })))
      .toBe('Ya existe un usuario con ese correo.');
  });

  it('da un mensaje claro para sesión inválida', () => {
    expect(describeError(http(401))).toContain('sesión');
  });

  it('no expone detalles técnicos en errores 5xx', () => {
    const message = describeError(http(500, { detail: 'NullReferenceException en Foo.Bar' }));

    expect(message).not.toContain('NullReferenceException');
    expect(message).toContain('servidor');
  });

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(describeError(new Error('boom'))).toBe('Ocurrió un error inesperado.');
  });
});
