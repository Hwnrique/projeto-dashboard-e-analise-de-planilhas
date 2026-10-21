import { HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly saindo = signal(false);
  protected readonly erro = signal('');
  protected readonly modoEscuro = signal(false);
  protected readonly usuario = this.authService.currentUser();
  protected readonly admin = this.authService.isAdmin();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.modoEscuro.set(localStorage.getItem('fcx-theme') === 'dark');
      this.document.body.classList.toggle('dark-theme', this.modoEscuro());
    }
  }

  protected alternarTema(): void {
    this.modoEscuro.update((ativo) => !ativo);
    this.document.body.classList.toggle('dark-theme', this.modoEscuro());
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('fcx-theme', this.modoEscuro() ? 'dark' : 'light');
    }
  }

  protected sair(): void {
    this.saindo.set(true);
    this.erro.set('');
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error: HttpErrorResponse) => {
        this.erro.set(error.error?.message ?? 'Não foi possível encerrar a sessão.');
        this.saindo.set(false);
      },
    });
  }
}
