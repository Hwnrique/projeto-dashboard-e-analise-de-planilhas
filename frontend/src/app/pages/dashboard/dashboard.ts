import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, ImportedReport, ReportKind } from '../../services/auth.service';

type DashboardSummary = {
  report: ImportedReport | null;
  targetValue: number;
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly recarga = signal<DashboardSummary | null>(null);
  protected readonly pix = signal<DashboardSummary | null>(null);
  protected readonly recargaLoading = signal(true);
  protected readonly pixLoading = signal(true);
  protected readonly recargaError = signal('');
  protected readonly pixError = signal('');

  ngOnInit(): void {
    this.loadSummary('recarga');
    this.loadSummary('pix');
  }

  protected progress(summary: DashboardSummary | null): number {
    if (!summary?.report || summary.targetValue <= 0) return 0;
    return Math.min((Number(summary.report.totalValue) / summary.targetValue) * 100, 100);
  }

  protected progressStyle(summary: DashboardSummary | null): string {
    const percent = this.progress(summary);
    const color = this.goalStatus(summary) === 'reached'
      ? '#55b865'
      : this.goalStatus(summary) === 'near' ? '#edbd3f' : '#e9655b';
    return `conic-gradient(${color} 0 ${percent}%, #edf0eb ${percent}% 100%)`;
  }

  protected goalStatus(summary: DashboardSummary | null): 'far' | 'near' | 'reached' {
    if (!summary?.report || summary.targetValue <= 0) return 'far';
    const ratio = Number(summary.report.totalValue) / summary.targetValue;
    if (ratio >= 1) return 'reached';
    return ratio >= 0.8 ? 'near' : 'far';
  }

  protected currentValue(summary: DashboardSummary | null, kind: ReportKind): string {
    if (!summary?.report) return '—';
    const value = Number(summary.report.totalValue);
    return kind === 'pix' ? this.formatCount(value) : this.formatCurrency(value);
  }

  protected targetValue(summary: DashboardSummary | null, kind: ReportKind): string {
    if (!summary) return kind === 'pix' ? this.formatCount(5000) : this.formatCurrency(40000);
    return kind === 'pix'
      ? this.formatCount(summary.targetValue)
      : this.formatCurrency(summary.targetValue);
  }

  protected formatOperatorValue(value: string, kind: ReportKind): string {
    return kind === 'pix' ? this.formatCount(Number(value)) : this.formatCurrency(Number(value));
  }

  protected percentLabel(summary: DashboardSummary | null): number {
    if (!summary?.report || summary.targetValue <= 0) return 0;
    return Math.round((Number(summary.report.totalValue) / summary.targetValue) * 100);
  }

  private loadSummary(kind: ReportKind): void {
    this.auth.latestReport(kind).subscribe({
      next: ({ report, targetValue }) => {
        const summary = { report, targetValue: Number(targetValue) };
        if (kind === 'pix') {
          this.pix.set(summary);
          this.pixLoading.set(false);
        } else {
          this.recarga.set(summary);
          this.recargaLoading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message ?? 'Não foi possível carregar este resumo.';
        if (kind === 'pix') {
          this.pixError.set(message);
          this.pixLoading.set(false);
        } else {
          this.recargaError.set(message);
          this.recargaLoading.set(false);
        }
      },
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatCount(value: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  }
}
