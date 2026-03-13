import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinner,
  ],
  template: `
    <div class="profile-container">
      <h1 class="page-title">Mon profil</h1>

      <!-- Section 1: Informations générales -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Informations générales</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput [(ngModel)]="username" name="username" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="saveProfile()" [disabled]="savingProfile()">
            @if (savingProfile()) {
              <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
            }
            Enregistrer
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Section 2: Avatar -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Avatar</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="avatar-section">
            @if (avatarPreview() || auth.user()?.avatar_url) {
              <img class="avatar-preview" [src]="avatarPreview() || auth.user()!.avatar_url!" alt="Avatar" />
            } @else {
              <div class="avatar-placeholder-large">{{ auth.user()?.username?.charAt(0)?.toUpperCase() }}</div>
            }
            <div class="avatar-actions">
              <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)" />
              <button mat-stroked-button (click)="fileInput.click()">Choisir une image</button>
              @if (selectedFile()) {
                <button mat-flat-button color="primary" (click)="uploadAvatar()" [disabled]="uploadingAvatar()">
                  @if (uploadingAvatar()) {
                    <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
                  }
                  Uploader
                </button>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Section 3: Mot de passe -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-card-title>Changer le mot de passe</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mot de passe actuel</mat-label>
            <input matInput type="password" [(ngModel)]="currentPassword" name="currentPassword" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nouveau mot de passe</mat-label>
            <input matInput type="password" [(ngModel)]="newPassword" name="newPassword" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmer le nouveau mot de passe</mat-label>
            <input matInput type="password" [(ngModel)]="confirmPassword" name="confirmPassword" />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="warn" (click)="changePassword()" [disabled]="changingPassword()">
            @if (changingPassword()) {
              <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"></mat-spinner>
            }
            Changer le mot de passe
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 32px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .section-card {
      border-radius: var(--radius-lg);
    }
    .full-width {
      width: 100%;
      margin-top: 12px;
    }
    mat-card-actions {
      padding: 8px 16px 16px;
    }
    .avatar-section {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 12px;
    }
    .avatar-preview {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--accent-primary);
    }
    .avatar-placeholder-large {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
    }
    .avatar-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `],
})
export class ProfileComponent {
  username = '';
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  savingProfile = signal(false);
  uploadingAvatar = signal(false);
  changingPassword = signal(false);
  selectedFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  constructor(public auth: AuthService, private userService: UserService, private snackBar: MatSnackBar) {
    this.username = auth.user()?.username ?? '';
    this.email = auth.user()?.email ?? '';
  }

  saveProfile() {
    this.savingProfile.set(true);
    this.userService.updateProfile({ username: this.username, email: this.email }).subscribe({
      next: () => {
        this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.savingProfile.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.error || 'Erreur lors de la mise à jour', 'Fermer', { duration: 4000 });
        this.savingProfile.set(false);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  uploadAvatar() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.userService.uploadAvatar(file).subscribe({
      next: () => {
        this.snackBar.open('Avatar mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.selectedFile.set(null);
        this.uploadingAvatar.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.error || 'Erreur lors de l\'upload', 'Fermer', { duration: 4000 });
        this.uploadingAvatar.set(false);
      },
    });
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open('Les mots de passe ne correspondent pas', 'Fermer', { duration: 4000 });
      return;
    }
    if (this.newPassword.length < 6) {
      this.snackBar.open('Le nouveau mot de passe doit faire au moins 6 caractères', 'Fermer', { duration: 4000 });
      return;
    }
    this.changingPassword.set(true);
    this.userService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe changé avec succès', 'Fermer', { duration: 3000 });
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.changingPassword.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.error || 'Erreur lors du changement de mot de passe', 'Fermer', { duration: 4000 });
        this.changingPassword.set(false);
      },
    });
  }
}
