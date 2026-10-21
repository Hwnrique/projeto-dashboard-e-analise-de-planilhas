import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, switchMap, tap, throwError } from 'rxjs';

export interface LoginCredentials {
  login: string;
  senha: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  nome: string;
  login: string;
  role: 'admin' | 'user';
}

export interface NewUser {
  nome: string;
  login: string;
  senha: string;
}

export interface AccessTokenResponse {
  accessToken: string;
}

export type ReportKind = 'pix' | 'recarga';

export interface ImportedReportRow {
  operator: string;
  operatorName: string | null;
  value: string;
}

export interface OperatorRecord {
  code: string;
  fullName: string;
}

export interface ImportedReport {
  id: number;
  kind: ReportKind;
  fileName: string;
  valueColumn: string;
  rowCount: number;
  totalValue: string;
  rows: ImportedReportRow[];
  importedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://10.122.72.63:3000';
  private accessToken: string | null = null;
  private profile: UserProfile | null = null;

  login(credentials: LoginCredentials) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(tap((response) => {
        this.accessToken = response.accessToken;
        this.profile = response.user;
      }));
  }

  restoreSession() {
    return this.http
      .post<AccessTokenResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => (this.accessToken = response.accessToken)),
        switchMap(() => this.loadCurrentUser()),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => error);
        }),
      );
  }

  logout() {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  currentUser(): UserProfile | null { return this.profile; }
  isAdmin(): boolean { return this.profile?.role === 'admin'; }

  loadCurrentUser() {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/me`, { headers: this.authHeaders() })
      .pipe(tap((user) => (this.profile = user)));
  }

  listUsers() {
    return this.http.get<UserProfile[]>(`${this.apiUrl}/users`, { headers: this.authHeaders() });
  }

  createUser(user: NewUser) {
    return this.http.post<{ message: string; id: number }>(`${this.apiUrl}/cadastro`, user, { headers: this.authHeaders() });
  }

  latestReport(kind: ReportKind) {
    return this.http.get<{ report: ImportedReport | null; targetValue: string }>(
      `${this.apiUrl}/reports/${kind}/latest`,
      { headers: this.authHeaders() },
    );
  }

  updateReportGoal(kind: ReportKind, targetValue: number) {
    return this.http.put<{
      message: string;
      goal: { kind: ReportKind; targetValue: string };
    }>(`${this.apiUrl}/reports/${kind}/goal`, { targetValue }, { headers: this.authHeaders() });
  }

  uploadReport(kind: ReportKind, file: File) {
    return this.http.post<{ report: ImportedReport }>(
      `${this.apiUrl}/reports/${kind}`,
      file,
      {
        headers: {
          ...this.authHeaders(),
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
        },
      },
    );
  }

  listOperators() {
    return this.http.get<OperatorRecord[]>(`${this.apiUrl}/operators`, {
      headers: this.authHeaders(),
    });
  }

  saveOperator(operator: OperatorRecord) {
    return this.http.post<{ message: string; operator: OperatorRecord }>(
      `${this.apiUrl}/operators`, operator, { headers: this.authHeaders() },
    );
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.accessToken ?? ''}` };
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  clearSession(): void {
    this.accessToken = null;
    this.profile = null;
  }
}
