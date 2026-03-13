import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, Category, TaskStatus, TaskPriority } from '../../core/models/task.model';
import { CategoryService } from '../../core/services/category.service';

export interface TaskFormData {
  task?: Task;
  categories: Category[];
}

@Component({
  selector: 'app-task-form',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifier la tache' : 'Nouvelle tache' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Titre</mat-label>
        <input matInput [(ngModel)]="title" maxlength="255" required />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description (optionnel)</mat-label>
        <textarea matInput [(ngModel)]="description" rows="3"></textarea>
      </mat-form-field>

      <div class="row-fields">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Statut</mat-label>
          <mat-select [(ngModel)]="status">
            <mat-option value="todo">A faire</mat-option>
            <mat-option value="in_progress">En cours</mat-option>
            <mat-option value="done">Termine</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Priorite</mat-label>
          <mat-select [(ngModel)]="priority">
            <mat-option value="low">Faible</mat-option>
            <mat-option value="medium">Moyenne</mat-option>
            <mat-option value="high">Haute</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="row-fields">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Echeance (optionnel)</mat-label>
          <input matInput type="date" [(ngModel)]="due_date" />
        </mat-form-field>

        <div class="category-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Categorie (optionnel)</mat-label>
            <mat-select [(ngModel)]="category_id">
              <mat-option [value]="null">Aucune</mat-option>
              @for (cat of localCategories; track cat.id) {
                <mat-option [value]="cat.id">
                  <span class="cat-dot" [style.background]="cat.color"></span>
                  {{ cat.name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-icon-button type="button" (click)="showCategoryForm = !showCategoryForm"
                  [color]="showCategoryForm ? 'warn' : 'primary'"
                  [matTooltip]="showCategoryForm ? 'Annuler' : 'Nouvelle categorie'">
            <mat-icon>{{ showCategoryForm ? 'close' : 'add' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (showCategoryForm) {
        <div class="new-cat-form">
          <mat-form-field appearance="outline" class="cat-name-field">
            <mat-label>Nom de la categorie</mat-label>
            <input matInput [(ngModel)]="newCatName" maxlength="50" />
          </mat-form-field>
          <div class="cat-color-row">
            <label class="color-label">Couleur :</label>
            <input type="color" [(ngModel)]="newCatColor" class="color-input" />
            <button mat-flat-button color="primary" (click)="createCategory()"
                    [disabled]="!newCatName.trim() || savingCategory || categoryCreated">
              @if (savingCategory) {
                <mat-spinner diameter="16"></mat-spinner>
              } @else if (categoryCreated) {
                Categorie creee
              } @else {
                Creer
              }
            </button>
          </div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!title.trim()">
        {{ isEdit ? 'Modifier' : 'Creer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .row-fields {
        display: flex;
        gap: 12px;
      }
      .half-width {
        flex: 1;
      }
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 360px;
      }
      .cat-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
      }
      .category-row {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
      }
      .new-cat-form {
        background: var(--mat-app-surface-variant, #f5f5f5);
        border-radius: var(--radius-md);
        padding: 12px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .cat-name-field { width: 100%; }
      .cat-color-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .color-label { font-size: 14px; color: rgba(0,0,0,.6); }
      .color-input {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
      }
    `,
  ],
})
export class TaskFormComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<TaskFormComponent>);
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);
  data = inject<TaskFormData>(MAT_DIALOG_DATA, { optional: true });

  isEdit = false;
  title = '';
  description = '';
  status: TaskStatus = 'todo';
  priority: TaskPriority = 'medium';
  due_date = '';
  category_id: number | null = null;

  localCategories: Category[] = [];
  showCategoryForm = false;
  newCatName = '';
  newCatColor = 'var(--accent-primary)';
  savingCategory = false;
  categoryCreated = false;

  ngOnInit() {
    this.localCategories = [...(this.data?.categories ?? [])];
    if (this.data?.task) {
      this.isEdit = true;
      this.title = this.data.task.title;
      this.description = this.data.task.description ?? '';
      this.status = this.data.task.status;
      this.priority = this.data.task.priority;
      this.due_date = this.data.task.due_date ?? '';
      this.category_id = this.data.task.category_id;
    }
  }

  createCategory() {
    if (!this.newCatName.trim()) return;
    this.savingCategory = true;
    this.categoryService.create({ name: this.newCatName.trim(), color: this.newCatColor })
      .subscribe({
        next: (cat) => {
          this.localCategories.push(cat);
          this.category_id = cat.id;
          setTimeout(() => {
            this.savingCategory = false;
            this.categoryCreated = true;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.showCategoryForm = false;
              this.categoryCreated = false;
              this.newCatName = '';
              this.newCatColor = 'var(--accent-primary)';
              this.cdr.detectChanges();
            }, 1000);
          }, 800);
        },
        error: () => { this.savingCategory = false; }
      });
  }

  save() {
    if (!this.title.trim()) return;
    this.dialogRef.close({
      title: this.title.trim(),
      description: this.description || undefined,
      status: this.status,
      priority: this.priority,
      due_date: this.due_date || undefined,
      category_id: this.category_id,
    });
  }
}
