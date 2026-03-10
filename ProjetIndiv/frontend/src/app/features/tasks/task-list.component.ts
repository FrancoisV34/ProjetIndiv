import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Task, Category, TaskStatus, TaskFilters } from '../../core/models/task.model';
import { TaskCardComponent } from './task-card.component';

@Component({
  selector: 'app-task-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TaskCardComponent,
  ],
  template: `
    <div class="list-header">
      <h2>Mes tâches</h2>
      <button mat-fab extended color="primary" (click)="onAdd.emit()">
        <mat-icon>add</mat-icon>
        Nouvelle tâche
      </button>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Rechercher</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="searchValue" (ngModelChange)="emitFilters()" placeholder="Titre ou description..." />
        @if (searchValue) {
          <button matSuffix mat-icon-button (click)="searchValue = ''; emitFilters()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Statut</mat-label>
        <mat-select [(ngModel)]="statusValue" (ngModelChange)="emitFilters()">
          <mat-option value="">Tous</mat-option>
          <mat-option value="todo">À faire</mat-option>
          <mat-option value="in_progress">En cours</mat-option>
          <mat-option value="done">Terminées</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Catégorie</mat-label>
        <mat-select [(ngModel)]="categoryValue" (ngModelChange)="emitFilters()">
          <mat-option value="">Toutes</mat-option>
          @for (cat of categories(); track cat.id) {
            <mat-option [value]="cat.id">
              <span class="cat-dot" [style.background]="cat.color"></span>
              {{ cat.name }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (tasks().length === 0) {
      <div class="empty-state">
        <mat-icon>task_alt</mat-icon>
        <p>Aucune tâche trouvée.</p>
        <p>Créez votre première tâche ou modifiez les filtres.</p>
      </div>
    }

    @for (task of tasks(); track task.id) {
      <app-task-card
        [task]="task"
        (onEdit)="onEdit.emit($event)"
        (onDelete)="onDelete.emit($event)"
      />
    }
  `,
  styles: [
    `
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .list-header h2 {
        margin: 0;
        font-size: 1.3rem;
      }
      .filters {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        align-items: flex-start;
      }
      .filter-search {
        flex: 2;
        min-width: 200px;
      }
      .filter-select {
        flex: 1;
        min-width: 140px;
      }
      .empty-state {
        text-align: center;
        padding: 48px 16px;
        opacity: 0.5;
      }
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
      .cat-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
        vertical-align: middle;
      }
    `,
  ],
})
export class TaskListComponent {
  tasks = input.required<Task[]>();
  categories = input<Category[]>([]);

  onAdd = output<void>();
  onEdit = output<Task>();
  onDelete = output<number>();
  onFilter = output<TaskFilters>();

  searchValue = '';
  statusValue: TaskStatus | '' = '';
  categoryValue: number | '' = '';

  emitFilters() {
    const filters: TaskFilters = {};
    if (this.searchValue.trim()) filters.search = this.searchValue.trim();
    if (this.statusValue) filters.status = this.statusValue;
    if (this.categoryValue) filters.category_id = this.categoryValue as number;
    this.onFilter.emit(filters);
  }
}
