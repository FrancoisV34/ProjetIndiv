import { Component, input, output, signal, computed, OnInit } from '@angular/core';
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
      <div class="header-actions">
        <button mat-button color="primary" class="toggle-view-btn" (click)="toggleView()">
          <mat-icon>{{ viewMode() === 'list' ? 'view_column' : 'view_list' }}</mat-icon>
          {{ viewMode() === 'list' ? 'Liste' : 'Tableau' }}
        </button>
        <button mat-fab extended color="primary" (click)="onAdd.emit()">
          <mat-icon>add</mat-icon>
          Nouvelle tâche
        </button>
      </div>
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

      @if (viewMode() === 'list') {
        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Statut</mat-label>
          <mat-select [(ngModel)]="statusValue" (ngModelChange)="emitFilters()">
            <mat-option value="">Tous</mat-option>
            <mat-option value="todo">À faire</mat-option>
            <mat-option value="in_progress">En cours</mat-option>
            <mat-option value="done">Terminées</mat-option>
          </mat-select>
        </mat-form-field>
      }

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

    @if (viewMode() === 'list') {
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
    } @else {
      <div class="board">
        @for (col of columns; track col.status) {
          <div class="board-col">
            <div class="board-col-header" [class]="'col-' + col.status">
              <span>{{ col.label }}</span>
              <span class="col-count">{{ col.tasks().length }}</span>
            </div>
            @if (col.tasks().length === 0) {
              <div class="col-empty">Aucune tâche</div>
            }
            @for (task of col.tasks(); track task.id) {
              <app-task-card
                [task]="task"
                (onEdit)="onEdit.emit($event)"
                (onDelete)="onDelete.emit($event)"
              />
            }
          </div>
        }
      </div>
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
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toggle-view-btn {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: var(--radius-full);
        padding: 0 20px;
        height: 56px;
        font-size: var(--mat-sys-label-large-size);
        font-weight: var(--mat-sys-label-large-weight);
        letter-spacing: var(--mat-sys-label-large-tracking);
      }
      .toggle-view-btn mat-icon {
        margin-right: 12px;
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
      .board {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        overflow-x: auto;
      }
      .board-col {
        flex: 1;
        min-width: 260px;
        background: var(--surface-alt, rgba(0,0,0,.03));
        border-radius: 10px;
        padding: 12px;
      }
      .board-col-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 6px 4px 12px;
        border-bottom: 2px solid transparent;
      }
      .board-col-header.col-todo        { border-color: #3b82f6; color: #3b82f6; }
      .board-col-header.col-in_progress { border-color: #f59e0b; color: #f59e0b; }
      .board-col-header.col-done        { border-color: var(--color-success); color: var(--color-success); }
      .col-count {
        background: rgba(0,0,0,.08);
        border-radius: 10px;
        padding: 1px 8px;
        font-size: 0.8rem;
      }
      .col-empty {
        text-align: center;
        padding: 24px 8px;
        opacity: 0.4;
        font-size: 0.85rem;
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

  viewMode = signal<'list' | 'board'>('list');

  todoTasks = computed(() => this.tasks().filter(t => t.status === 'todo'));
  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'in_progress'));
  doneTasks = computed(() => this.tasks().filter(t => t.status === 'done'));

  columns = [
    { status: 'todo',        label: 'À faire',  tasks: this.todoTasks },
    { status: 'in_progress', label: 'En cours', tasks: this.inProgressTasks },
    { status: 'done',        label: 'Terminé',  tasks: this.doneTasks },
  ];

  toggleView() {
    this.viewMode.update(v => v === 'list' ? 'board' : 'list');
    if (this.viewMode() === 'board') {
      this.statusValue = '';
      this.emitFilters();
    }
  }

  emitFilters() {
    const filters: TaskFilters = {};
    if (this.searchValue.trim()) filters.search = this.searchValue.trim();
    if (this.statusValue) filters.status = this.statusValue;
    if (this.categoryValue) filters.category_id = this.categoryValue as number;
    this.onFilter.emit(filters);
  }
}
