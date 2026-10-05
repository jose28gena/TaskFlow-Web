import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let token: string | null;
  let logout: jasmine.Spy;

  beforeEach(() => {
    token = 'TOKEN';
    logout = jasmine.createSpy('logout');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: () => token, logout } }
      ]
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('agrega el token a las llamadas a la API', () => {
    http.get('/api/tasks').subscribe();

    const req = controller.expectOne('/api/tasks');
    expect(req.request.headers.get('Authorization')).toBe('Bearer TOKEN');
    req.flush({});
  });

  it('no envía el token en login ni registro', () => {
    http.post('/api/auth/login', {}).subscribe();

    const req = controller.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('no filtra el token hacia dominios externos', () => {
    http.get('https://otro-dominio.example/datos').subscribe();

    const req = controller.expectOne('https://otro-dominio.example/datos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('no agrega encabezado si no hay sesión vigente', () => {
    token = null;

    http.get('/api/tasks').subscribe();

    const req = controller.expectOne('/api/tasks');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('cierra la sesión cuando la API responde 401 a una llamada autenticada', () => {
    http.get('/api/tasks').subscribe({ error: () => undefined });

    controller.expectOne('/api/tasks').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('un 401 en el login (credenciales malas) no cierra sesión ni redirige', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    controller.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
  });

  it('otros errores se propagan sin cerrar sesión', () => {
    let status = 0;
    http.get('/api/tasks').subscribe({ error: (e) => (status = e.status) });

    controller.expectOne('/api/tasks').flush({}, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(logout).not.toHaveBeenCalled();
  });
});
