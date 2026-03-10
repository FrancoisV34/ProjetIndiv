import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<Category[]>('/api/categories');
  }

  create(data: { name: string; color?: string }) {
    return this.http.post<Category>('/api/categories', data);
  }

  update(id: number, data: { name?: string; color?: string }) {
    return this.http.put<Category>(`/api/categories/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`/api/categories/${id}`);
  }
}
