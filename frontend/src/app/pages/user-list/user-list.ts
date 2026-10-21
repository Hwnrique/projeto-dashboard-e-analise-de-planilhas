import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({ selector: 'app-user-list', templateUrl: './user-list.html', styleUrl: './user-list.css' })
export class UserList implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly users = signal<UserProfile[]>([]);
  protected readonly erro = signal('');
  protected readonly carregando = signal(true);
  ngOnInit(): void { this.carregar(); }

  protected carregar(): void {
    this.carregando.set(true); this.erro.set('');
    this.auth.listUsers().subscribe({
      next: (users) => { this.users.set(users); this.carregando.set(false); },
      error: (error: HttpErrorResponse) => { this.erro.set(error.error?.message ?? 'Não foi possível carregar os usuários.'); this.carregando.set(false); },
    });
  }
}
