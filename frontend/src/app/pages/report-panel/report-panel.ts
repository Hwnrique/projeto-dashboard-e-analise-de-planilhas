import { HttpErrorResponse } from '@angular/common/http';
import { UpperCasePipe } from '@angular/common';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { AuthService, ImportedReport, ReportKind } from '../../services/auth.service';

@Component({
  selector: 'app-report-panel',
  imports: [UpperCasePipe],
  templateUrl: './report-panel.html',
  styleUrl: './report-panel.css',
})
export class ReportPanel implements OnInit {
  @Input({ required: true }) kind!: ReportKind;

  private readonly auth = inject(AuthService);
  protected readonly isAdmin = this.auth.isAdmin();
  protected readonly report = signal<ImportedReport | null>(null);
  protected readonly loading = signal(true);
  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);
  protected readonly error = signal('');
  protected readonly targetGoal = signal(40_000);
  protected readonly editingGoal = signal(false);
  protected readonly savingGoal = signal(false);

  ngOnInit(): void {
    this.loadLatest();
  }

  protected loadLatest(): void {
    this.loading.set(true);
    this.auth.latestReport(this.kind).subscribe({
      next: ({ report, targetValue }) => {
        this.report.set(report);
        this.targetGoal.set(Number(targetValue));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.message ?? 'Não foi possível carregar os dados.');
        this.loading.set(false);
      },
    });
  }

  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (file) this.upload(file);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (files.length > 1) {
      this.error.set('Envie um arquivo por vez.');
      return;
    }
    const file = files.item(0);
    if (file) this.upload(file);
  }

  protected formatTotal(value: string): string {
    return this.report()?.valueColumn === 'Valor Total'
      ? this.formatCurrency(Number(value))
      : new Intl.NumberFormat('pt-BR').format(Number(value));
  }

  protected formatRow(value: string): string {
    const number = Number(value);
    return this.report()?.valueColumn === 'Valor Total'
      ? this.formatCurrency(number)
      : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(number);
  }

  protected hasGoalMetric(report: ImportedReport): boolean {
    return this.kind === 'pix'
      ? report.valueColumn === 'Quantidade de Transacoes'
      : report.valueColumn === 'Valor Total';
  }

  protected goalStatus(report: ImportedReport): 'far' | 'near' | 'reached' {
    const progress = Number(report.totalValue) / this.targetGoal();
    if (progress >= 1) return 'reached';
    if (progress >= 0.8) return 'near';
    return 'far';
  }

  protected goalProgress(report: ImportedReport): number {
    return Math.min((Number(report.totalValue) / this.targetGoal()) * 100, 100);
  }

  protected goalPercent(report: ImportedReport): number {
    return Math.round((Number(report.totalValue) / this.targetGoal()) * 100);
  }

  protected remainingForGoal(report: ImportedReport): number {
    return Math.max(this.targetGoal() - Number(report.totalValue), 0);
  }

  protected formatGoalValue(value: number): string {
    return this.kind === 'pix'
      ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
      : this.formatCurrency(value);
  }

  protected formatAverage(report: ImportedReport): string {
    const average = Number(report.totalValue) / report.rowCount;
    return this.kind === 'pix'
      ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(average)
      : this.formatCurrency(average);
  }

  protected saveGoal(rawValue: string): void {
    const targetValue = Number(rawValue);
    if (!Number.isFinite(targetValue) || targetValue <= 0 || (this.kind === 'pix' && !Number.isInteger(targetValue))) {
      this.error.set(this.kind === 'pix' ? 'Informe uma meta inteira maior que zero.' : 'Informe uma meta válida maior que zero.');
      return;
    }

    this.error.set('');
    this.savingGoal.set(true);
    this.auth.updateReportGoal(this.kind, targetValue).subscribe({
      next: ({ goal }) => {
        this.targetGoal.set(Number(goal.targetValue));
        this.editingGoal.set(false);
        this.savingGoal.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.message ?? 'Não foi possível atualizar a meta.');
        this.savingGoal.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected numberValue(value: string): number {
    return Number(value);
  }

  protected formatDate(value: string): string {
    return new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('pt-BR');
  }

  private upload(file: File): void {
    this.error.set('');
    this.uploading.set(true);
    this.auth.uploadReport(this.kind, file).subscribe({
      next: ({ report }) => {
        this.report.set(report);
        this.uploading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.message ?? 'Não foi possível importar o arquivo.');
        this.uploading.set(false);
      },
    });
  }
}
