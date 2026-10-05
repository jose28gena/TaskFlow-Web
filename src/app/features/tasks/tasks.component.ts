import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { describeError } from '../../core/api-error';
import { STATUSES, STATUS_LABELS, TaskItem, TaskStatus } from '../../core/models';
import { TasksService } from '../../core/tasks.service';

@Component({
  selector: 'app-tasks',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent implements OnInit {
  private readonly api = inject(TasksService);

  protected readonly statuses = STATUSES;
  protected readonly labels = STATUS_LABELS;
  protected readonly pageSize = 8;

  protected readonly tasks = signal<TaskItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly filter = signal<TaskStatus | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmingId = signal<string | null>(null);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]]
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list({ status: this.filter(), page: this.page(), pageSize: this.pageSize }).subscribe({
      next: (res) => {
        // Si se borró el último elemento de la última página, retrocede una página.
        if (res.items.length === 0 && res.totalCount > 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          this.load();
          return;
        }
        this.tasks.set(res.items);
        this.total.set(res.totalCount);
        this.loading.set(false);
      },
      error: (err: unknown) => this.fail(err)
    });
  }

  protected setFilter(status: TaskStatus | null): void {
    this.filter.set(status);
    this.page.set(1);
    this.load();
  }

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.load();
  }

  protected add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, description } = this.form.getRawValue();
    this.api.create({ title: title.trim(), description: description.trim() || null }).subscribe({
      next: () => {
        this.form.reset();
        this.page.set(1);
        this.load();
      },
      error: (err: unknown) => this.fail(err)
    });
  }

  protected onStatusChange(task: TaskItem, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as TaskStatus;
    if (status === task.status) return;

    this.api
      .update(task.id, {
        title: task.title,
        description: task.description,
        status,
        dueDate: task.dueDate
      })
      .subscribe({ next: () => this.load(), error: (err: unknown) => this.fail(err) });
  }

  // Borrado en dos pasos para evitar eliminar una tarea por un clic accidental.
  protected askDelete(task: TaskItem): void {
    this.confirmingId.set(task.id);
  }

  protected cancelDelete(): void {
    this.confirmingId.set(null);
  }

  protected confirmDelete(task: TaskItem): void {
    this.confirmingId.set(null);
    this.api.delete(task.id).subscribe({ next: () => this.load(), error: (err: unknown) => this.fail(err) });
  }

  private fail(err: unknown): void {
    this.error.set(describeError(err));
    this.loading.set(false);
  }
}
