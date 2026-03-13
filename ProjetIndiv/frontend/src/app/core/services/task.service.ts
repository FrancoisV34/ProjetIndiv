import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Task, CreateTaskDto, UpdateTaskDto, TaskFilters, PaginatedResponse } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  list(filters: TaskFilters = {}) {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.category_id) params = params.set('category_id', String(filters.category_id));
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<PaginatedResponse<Task>>('/api/tasks', { params });
  }

  create(data: CreateTaskDto) {
    return this.http.post<Task>('/api/tasks', data);
  }

  update(id: number, data: UpdateTaskDto) {
    return this.http.put<Task>(`/api/tasks/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/api/tasks/${id}`);
  }
}
