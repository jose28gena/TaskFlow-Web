import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const STORAGE_KEY = 'taskflow.session';
const inOneHour = () => new Date(Date.now() + 3_600_000).toISOString();
const anHourAgo = () => new Date(Date.now() - 3_600_000).toISOString();

describe('AuthService', () => {
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  const create = (): AuthService => TestBed.inject(AuthService);

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('login guarda la sesión y la deja disponible', () => {
    const service = create();

    service.login('ana@test.com', 'Password123!').subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@test.com', password: 'Password123!' });
    req.flush({ token: 'TOKEN', expiresAt: inOneHour() });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('TOKEN');
    expect(service.email()).toBe('ana@test.com');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('TOKEN');
  });

  it('register usa el endpoint de registro y también inicia sesión', () => {
    const service = create();

    service.register('nuevo@test.com', 'Password123!').subscribe();
    http.expectOne('/api/auth/register').flush({ token: 'T2', expiresAt: inOneHour() });

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('un token vencido no cuenta como sesión', () => {
    const service = create();

    service.login('ana@test.com', 'Password123!').subscribe();
    http.expectOne('/api/auth/login').flush({ token: 'OLD', expiresAt: anHourAgo() });

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('logout borra la sesión y redirige al login', () => {
    const service = create();
    service.login('ana@test.com', 'Password123!').subscribe();
    http.expectOne('/api/auth/login').flush({ token: 'TOKEN', expiresAt: inOneHour() });

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.email()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('recupera una sesión vigente guardada en el navegador', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: 'ana@test.com', token: 'SAVED', expiresAt: inOneHour() })
    );

    const service = create();

    expect(service.token()).toBe('SAVED');
    expect(service.email()).toBe('ana@test.com');
  });

  it('ignora datos corruptos en el almacenamiento sin romper la app', () => {
    localStorage.setItem(STORAGE_KEY, 'esto-no-es-json');

    const service = create();

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('un error de login no deja sesión guardada', () => {
    const service = create();

    service.login('ana@test.com', 'mala-clave').subscribe({ error: () => undefined });
    http.expectOne('/api/auth/login').flush({ title: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
