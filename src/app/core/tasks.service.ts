import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './config';
import { Paged, TaskDraft, TaskItem, TaskStatus, TaskUpdate } from './models';

export interface ListOptions {
  status?: TaskStatus | null;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE}/tasks`;

  list({ status, page, pageSize }: ListOptions): Observable<Paged<TaskItem>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<Paged<TaskItem>>(this.url, { params });
  }

  create(draft: TaskDraft): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.url, draft);
  }

  update(id: string, task: TaskUpdate): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.url}/${id}`, task);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
