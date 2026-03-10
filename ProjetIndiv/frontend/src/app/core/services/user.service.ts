import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  updateProfile(data: { username?: string; email?: string }) {
    return this.http.put<User>('/api/users/me', data).pipe(
      tap(user => this.auth.updateUser(user))
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.put<User>('/api/users/me', data);
  }

  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);
    return this.http.post<{ avatar_url: string; user: User }>('/api/users/avatar', form).pipe(
      tap(res => this.auth.updateUser(res.user))
    );
  }
}
