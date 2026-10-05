import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Paged, TaskItem } from '../../core/models';
import { TasksService } from '../../core/tasks.service';
import { TasksComponent } from './tasks.component';

const task = (id: string, title: string, status: TaskItem['status'] = 'Todo'): TaskItem => ({
  id,
  title,
  description: null,
  status,
  dueDate: null,
  createdAt: '2026-01-15T12:00:00Z',
  updatedAt: '2026-01-15T12:00:00Z'
});

const page = (items: TaskItem[], totalCount = items.length, pageNumber = 1): Paged<TaskItem> => ({
  items,
  page: pageNumber,
  pageSize: 8,
  totalCount
});

describe('TasksComponent', () => {
  let fixture: ComponentFixture<TasksComponent>;
  let el: HTMLElement;
  let api: jasmine.SpyObj<TasksService>;

  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

  const create = (initial: Paged<TaskItem>) => {
    api.list.and.returnValue(of(initial));
    fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    api = jasmine.createSpyObj<TasksService>('TasksService', ['list', 'create', 'update', 'delete']);
    api.create.and.returnValue(of(task('new', 'Nueva')));
    api.update.and.returnValue(of(task('1', 'x')));
    api.delete.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [{ provide: TasksService, useValue: api }]
    });
  });

  it('carga y muestra las tareas al iniciar', () => {
    create(page([task('1', 'Estudiar Angular'), task('2', 'Hacer ejercicio', 'Done')]));

    expect(api.list).toHaveBeenCalledWith({ status: null, page: 1, pageSize: 8 });
    expect(el.querySelectorAll('.task').length).toBe(2);
    expect(el.textContent).toContain('Estudiar Angular');
    expect(el.querySelector('.task[data-status="Done"]')?.textContent).toContain('Hacer ejercicio');
  });

  it('muestra un estado vacío cuando no hay tareas', () => {
    create(page([]));

    expect(el.textContent).toContain('Aún no tienes tareas');
  });

  it('crea una tarea con el título recortado y recarga la lista', () => {
    create(page([]));
    const title = el.querySelector('#title') as HTMLInputElement;
    title.value = '  Preparar entrevista  ';
    title.dispatchEvent(new Event('input'));

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

    expect(api.create).toHaveBeenCalledWith({ title: 'Preparar entrevista', description: null });
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('no crea tareas sin título', () => {
    create(page([]));

    (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(api.create).not.toHaveBeenCalled();
    expect(el.textContent).toContain('El título es obligatorio.');
  });

  it('filtra por estado y vuelve a la primera página', () => {
    create(page([task('1', 'A')]));

    button('Hecha').click();

    expect(api.list).toHaveBeenCalledWith({ status: 'Done', page: 1, pageSize: 8 });
  });

  it('cambia el estado de una tarea conservando sus demás datos', () => {
    create(page([task('1', 'Estudiar')]));
    const select = el.querySelector('select') as HTMLSelectElement;

    select.value = 'InProgress';
    select.dispatchEvent(new Event('change'));

    expect(api.update).toHaveBeenCalledWith('1', {
      title: 'Estudiar',
      description: null,
      status: 'InProgress',
      dueDate: null
    });
  });

  it('pide confirmación antes de eliminar', () => {
    create(page([task('1', 'Estudiar')]));

    button('Eliminar').click();
    fixture.detectChanges();

    expect(api.delete).not.toHaveBeenCalled();
    expect(el.textContent).toContain('¿Eliminar?');

    button('Sí').click();

    expect(api.delete).toHaveBeenCalledWith('1');
  });

  it('permite cancelar la eliminación', () => {
    create(page([task('1', 'Estudiar')]));

    button('Eliminar').click();
    fixture.detectChanges();
    button('No').click();
    fixture.detectChanges();

    expect(api.delete).not.toHaveBeenCalled();
    expect(el.textContent).not.toContain('¿Eliminar?');
  });

  it('muestra el error cuando la API falla', () => {
    api.list.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudo conectar');
  });

  it('pagina: muestra el total de páginas y pide la siguiente', () => {
    create(page([task('1', 'A')], 20));

    expect(el.textContent).toContain('Página 1 de 3');
    expect(button('Anterior').disabled).toBeTrue();

    button('Siguiente').click();

    expect(api.list).toHaveBeenCalledWith({ status: null, page: 2, pageSize: 8 });
  });

  it('si la página actual queda vacía (por ejemplo tras borrar su último elemento), retrocede una página', () => {
    api.list.and.returnValues(
      of(page([task('1', 'A')], 9, 1)), // carga inicial: 9 tareas = 2 páginas
      of(page([], 8, 2)), // al pedir la página 2 ya está vacía (el total bajó a 8)
      of(page([task('1', 'A')], 8, 1)) // el componente vuelve a pedir la página 1
    );
    fixture = TestBed.createComponent(TasksComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;

    button('Siguiente').click();
    fixture.detectChanges();

    expect(api.list.calls.mostRecent().args[0]).toEqual({ status: null, page: 1, pageSize: 8 });
    expect(el.querySelectorAll('.task').length).toBe(1);
  });
});
