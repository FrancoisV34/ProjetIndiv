import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="navbar">
      <span class="brand" routerLink="/dashboard">TaskFlow</span>
      <span class="spacer"></span>
      @if (auth.isAuthenticated()) {
        <a class="user-section" [routerLink]="'/profile'">
          @if (auth.user()?.avatar_url) {
            <img class="avatar" [src]="auth.user()!.avatar_url!" [alt]="auth.user()!.username" />
          } @else {
            <div class="avatar-placeholder">{{ auth.user()?.username?.charAt(0)?.toUpperCase() }}</div>
          }
          <span class="user-info">{{ auth.user()?.username }}</span>
        </a>
        <button mat-button (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          Déconnexion
        </button>
      } @else {
        <a mat-button routerLink="/login">Connexion</a>
        <a mat-flat-button routerLink="/register">Inscription</a>
      }
    </mat-toolbar>
  `,
  styles: [
    `
      .navbar {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover));
        color: white;
      }
      .brand {
        font-weight: 700;
        font-size: 1.3rem;
        cursor: pointer;
        letter-spacing: -0.5px;
      }
      .spacer {
        flex: 1;
      }
      .user-section {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-right: 8px;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        border-radius: 8px;
        padding: 4px 8px;
        transition: background var(--transition-base);
      }
      .user-section:hover {
        background: rgba(255,255,255,0.15);
      }
      .user-info {
        opacity: 0.9;
        font-size: 0.9rem;
      }
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255,255,255,0.4);
      }
      .avatar-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
        border: 2px solid rgba(255,255,255,0.4);
      }
    `,
  ],
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
