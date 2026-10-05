import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let el: HTMLElement;
  let auth: { login: jasmine.Spy; register: jasmine.Spy };
  let navigate: jasmine.Spy;

  const type = (selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  const submit = () => {
    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    auth = {
      login: jasmine.createSpy('login').and.returnValue(of({ token: 'T', expiresAt: 'x' })),
      register: jasmine.createSpy('register').and.returnValue(of({ token: 'T', expiresAt: 'x' }))
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    });

    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('muestra el formulario de inicio de sesión por defecto', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Iniciar sesión');
    expect(el.querySelector('button[type="submit"]')?.textContent).toContain('Entrar');
  });

  it('no llama a la API con datos inválidos y muestra los errores', () => {
    type('#email', 'no-es-correo');
    type('#password', 'corta');
    submit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Escribe un correo válido.');
    expect(el.textContent).toContain('al menos 8 caracteres');
  });

  it('inicia sesión y navega a las tareas', () => {
    type('#email', '  ana@test.com ');
    type('#password', 'Password123!');
    submit();

    expect(auth.login).toHaveBeenCalledWith('ana@test.com', 'Password123!');
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('muestra el mensaje del servidor si las credenciales son incorrectas', () => {
    auth.login.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 401, error: { detail: 'Credenciales inválidas.' } }))
    );

    type('#email', 'ana@test.com');
    type('#password', 'Password123!');
    submit();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Credenciales inválidas.');
    expect(navigate).not.toHaveBeenCalled();
    expect((el.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('permite cambiar a registro y usa el endpoint de registro', () => {
    (el.querySelector('.link') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('h1')?.textContent).toContain('Crear cuenta');

    type('#email', 'nuevo@test.com');
    type('#password', 'Password123!');
    submit();

    expect(auth.register).toHaveBeenCalledWith('nuevo@test.com', 'Password123!');
    expect(auth.login).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/tasks']);
  });
});
