import { Component, OnInit, signal, computed } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../core/services/task.service';
import { CategoryService } from '../../core/services/category.service';
import { Task, Category, TaskFilters } from '../../core/models/task.model';
import { TaskListComponent } from '../tasks/task-list.component';
import { TaskFormComponent, TaskFormData } from '../tasks/task-form.component';

@Component({
  selector: 'app-dashboard',
  imports: [MatDialogModule, MatSnackBarModule, TaskListComponent],
  template: `
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-value">{{ tasks().length }}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-card completion">
        <div class="stat-value">{{ completionRate() }}%</div>
        <div class="stat-label">Complétion</div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="completionRate()"></div>
        </div>
      </div>
      <div class="stat-card todo">
        <div class="stat-value">{{ countByStatus('todo') }}</div>
        <div class="stat-label">À faire</div>
      </div>
      <div class="stat-card in-progress">
        <div class="stat-value">{{ countByStatus('in_progress') }}</div>
        <div class="stat-label">En cours</div>
      </div>
      <div class="stat-card done">
        <div class="stat-value">{{ countByStatus('done') }}</div>
        <div class="stat-label">Terminées</div>
      </div>
    </div>

    @if (categoryStats().length > 0) {
      <div class="category-stats">
        @for (stat of categoryStats(); track stat.name) {
          <span class="cat-badge" [style.background]="stat.color + '22'" [style.border-color]="stat.color">
            <span class="cat-dot" [style.background]="stat.color"></span>
            {{ stat.name }} <strong>{{ stat.count }}</strong>
          </span>
        }
      </div>
    }

    <app-task-list
      [tasks]="tasks()"
      [categories]="categories()"
      (onAdd)="openForm()"
      (onEdit)="openForm($event)"
      (onDelete)="deleteTask($event)"
      (onFilter)="applyFilters($event)"
    />
  `,
  styles: [
    `
      .stats-grid {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .stat-card {
        flex: 1;
        min-width: 100px;
        padding: 16px 20px;
        border-radius: var(--radius-lg);
        background: var(--mat-sys-surface-variant, #f1f5f9);
        text-align: center;
      }
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
      }
      .stat-label {
        font-size: 0.8rem;
        opacity: 0.65;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .stat-card.total .stat-value { color: var(--accent-primary); }
      .stat-card.todo .stat-value { color: var(--gray-600); }
      .stat-card.in-progress .stat-value { color: var(--color-warning); }
      .stat-card.done .stat-value { color: var(--color-success); }
      .stat-card.completion .stat-value { color: var(--accent-primary); }
      .progress-bar {
        margin-top: 8px;
        height: 4px;
        background: rgba(0,0,0,0.1);
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 2px;
        transition: width var(--transition-base);
      }
      .category-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 20px;
      }
      .cat-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        border: 1px solid;
        font-size: 0.85rem;
      }
      .cat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  tasks = signal<Task[]>([]);
  categories = signal<Category[]>([]);
  private activeFilters: TaskFilters = {};

  completionRate = computed(() => {
    const total = this.tasks().length;
    if (!total) return 0;
    return Math.round((this.countByStatus('done') / total) * 100);
  });

  categoryStats = computed(() => {
    const map = new Map<number, { name: string; color: string; count: number }>();
    for (const task of this.tasks()) {
      if (task.category) {
        const existing = map.get(task.category.id);
        if (existing) existing.count++;
        else map.set(task.category.id, { name: task.category.name, color: task.category.color, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  });

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.taskService.list(this.activeFilters).subscribe(res => this.tasks.set(res.data));
    this.categoryService.list().subscribe(cats => this.categories.set(cats));
  }

  applyFilters(filters: TaskFilters) {
    this.activeFilters = filters;
    this.taskService.list(filters).subscribe(res => this.tasks.set(res.data));
  }

  countByStatus(status: string): number {
    return this.tasks().filter(t => t.status === status).length;
  }

  openForm(task?: Task) {
    const data: TaskFormData = { task, categories: this.categories() };
    const ref = this.dialog.open(TaskFormComponent, { data });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = task
        ? this.taskService.update(task.id, result)
        : this.taskService.create(result);

      op.subscribe({
        next: () => {
          this.loadData();
          this.snackBar.open(task ? 'Tâche modifiée' : 'Tâche créée', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Erreur', 'OK', { duration: 2000 }),
      });
    });
  }

  deleteTask(id: number) {
    this.taskService.delete(id).subscribe({
      next: () => {
        this.loadData();
        this.snackBar.open('Tâche supprimée', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erreur', 'OK', { duration: 2000 }),
    });
  }
}
