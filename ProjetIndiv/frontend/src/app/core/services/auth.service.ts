import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.loadUser();
    }
  }

  register(username: string, email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/register', { username, email, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post('/api/auth/logout', { refreshToken }).subscribe();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    return this.http.post<{ token: string }>('/api/auth/refresh', { refreshToken }).pipe(
      tap(res => localStorage.setItem('token', res.token))
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  updateUser(user: User) {
    this.currentUser.set(user);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('refreshToken', res.refreshToken);
    this.currentUser.set(res.user);
  }

  private loadUser() {
    this.http.get<User>('/api/users/me').subscribe({
      next: user => this.currentUser.set(user),
      error: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.currentUser.set(null);
      },
    });
  }
}
