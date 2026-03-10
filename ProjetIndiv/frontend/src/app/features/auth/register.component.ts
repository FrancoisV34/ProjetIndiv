import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Inscription</mat-card-title>
          <mat-card-subtitle>Rejoins TaskFlow !</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (error()) {
            <p class="error">{{ error() }}</p>
          }
          <form (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nom d'utilisateur</mat-label>
              <input matInput [(ngModel)]="username" name="username" required minlength="2" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe (6 caracteres min.)</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required minlength="6" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" class="full-width" [disabled]="loading()">
              {{ loading() ? 'Inscription...' : "S'inscrire" }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button routerLink="/login">Deja un compte ? Se connecter</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 128px);
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 16px;
    }
    .full-width { width: 100%; }
    .error {
      color: var(--mat-sys-error);
      background: var(--mat-sys-error-container);
      padding: 8px 12px;
      border-radius: var(--radius-md);
      margin-bottom: 16px;
    }
    form { display: flex; flex-direction: column; gap: 4px; }
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || err.error?.errors?.[0] || "Erreur d'inscription");
      },
    });
  }
}
