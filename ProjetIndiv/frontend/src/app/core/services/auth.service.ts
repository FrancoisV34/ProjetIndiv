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
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUser.set(JSON.parse(stored));
    }
    if (localStorage.getItem('token')) {
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
    localStorage.removeItem('user');
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
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser() {
    this.http.get<User>('/api/users/me').subscribe({
      next: user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
      },
      error: () => {
        // Ne pas effacer currentUser ici : la valeur restaurée depuis localStorage reste valide.
        // Si le token est expiré, l'interceptor gère le refresh puis appelle logout() si nécessaire.
      },
    });
  }
}
