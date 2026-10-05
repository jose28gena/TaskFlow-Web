import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TasksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list envía página, tamaño y estado como parámetros', () => {
    service.list({ status: 'Done', page: 2, pageSize: 8 }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('8');
    expect(req.request.params.get('status')).toBe('Done');
    req.flush({ items: [], page: 2, pageSize: 8, totalCount: 0 });
  });

  it('list omite el parámetro de estado cuando no hay filtro', () => {
    service.list({ status: null, page: 1, pageSize: 8 }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/tasks');
    expect(req.request.params.has('status')).toBeFalse();
    req.flush({ items: [], page: 1, pageSize: 8, totalCount: 0 });
  });

  it('create hace POST con el borrador', () => {
    service.create({ title: 'Estudiar', description: null }).subscribe();

    const req = http.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Estudiar', description: null });
    req.flush({});
  });

  it('update hace PUT sobre la tarea indicada', () => {
    const body = { title: 'Estudiar', description: null, status: 'Done' as const, dueDate: null };

    service.update('abc', body).subscribe();

    const req = http.expectOne('/api/tasks/abc');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('delete hace DELETE sobre la tarea indicada', () => {
    service.delete('abc').subscribe();

    const req = http.expectOne('/api/tasks/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
