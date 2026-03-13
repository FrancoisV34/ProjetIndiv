import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Task, TaskStatus, TaskPriority } from '../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <mat-card
      class="task-card"
      [class.todo]="task().status === 'todo'"
      [class.in-progress]="task().status === 'in_progress'"
      [class.done]="task().status === 'done'"
      [class.priority-low]="task().priority === 'low'"
      [class.priority-medium]="task().priority === 'medium'"
      [class.priority-high]="task().priority === 'high'"
    >
      <div class="task-info">
        <div class="task-top">
          <h3 class="task-title">{{ task().title }}</h3>
          <div class="chips">
            <mat-chip [class]="'status-' + task().status">
              {{ statusLabel(task().status) }}
            </mat-chip>
            <mat-chip [class]="'priority-' + task().priority">
              {{ priorityLabel(task().priority) }}
            </mat-chip>
            @if (task().category) {
              <mat-chip
                [style.background]="task().category!.color + '33'"
                [style.color]="task().category!.color"
              >
                {{ task().category!.name }}
              </mat-chip>
            }
          </div>
        </div>
        @if (task().description) {
          <p class="task-desc">{{ task().description }}</p>
        }
        @if (task().due_date) {
          <span class="due-date" [class.overdue]="isOverdue()">
            Echeance : {{ formatDate(task().due_date!) }}
          </span>
        }
      </div>
      <div class="task-actions">
        <button mat-icon-button (click)="onEdit.emit(task())" title="Modifier">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button (click)="onDelete.emit(task().id)" title="Supprimer">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .task-card {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
        padding: 16px 20px;
        margin-bottom: 12px;
        transition: all var(--transition-base);
      }
      .task-card.todo {
        border-left: 4px solid #3b82f6;
      }
      .task-card.in-progress {
        border-left: 4px solid #f59e0b;
      }
      .task-card.done {
        border-left: 4px solid var(--color-success);
        opacity: 0.6;
      }
      .task-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 2px 1px rgba(0, 0, 0, 0.15), 0 2px 2px rgba(0, 0, 0, 0.08);
      }
      .task-info {
        flex: 1;
      }
      .task-top {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }
      .task-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
      }
      .chips {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .task-desc {
        margin: 4px 0 6px;
        font-size: 0.9rem;
        opacity: 0.7;
        white-space: pre-line;
      }
      .due-date {
        font-size: 0.82rem;
        opacity: 0.6;
      }
      .due-date.overdue {
        color: var(--color-danger);
        opacity: 1;
        font-weight: 600;
      }
      .task-actions {
        display: flex;
        align-items: center;
      }
      mat-chip.status-todo {
        background: var(--status-todo-bg);
        color: var(--status-todo-text);
      }
      mat-chip.status-in_progress {
        background: var(--status-wip-bg);
        color: var(--status-wip-text);
      }
      mat-chip.status-done {
        background: var(--status-done-bg);
        color: var(--status-done-text);
      }
      mat-chip.priority-low {
        background: var(--priority-low-bg);
        color: var(--priority-low-text);
      }
      mat-chip.priority-medium {
        background: var(--priority-med-bg);
        color: var(--priority-med-text);
      }
      mat-chip.priority-high {
        background: var(--priority-high-bg);
        color: var(--priority-high-text);
      }
    `,
  ],
})
export class TaskCardComponent {
  task = input.required<Task>();

  onEdit = output<Task>();
  onDelete = output<number>();

  statusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'A faire',
      in_progress: 'En cours',
      done: 'Termine',
    };
    return labels[status];
  }

  priorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Haute',
    };
    return labels[priority];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  isOverdue(): boolean {
    if (!this.task().due_date || this.task().status === 'done') return false;
    return new Date(this.task().due_date!) < new Date();
  }
}
