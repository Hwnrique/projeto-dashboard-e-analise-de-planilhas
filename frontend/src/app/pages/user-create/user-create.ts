import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-user-create', imports: [ReactiveFormsModule], templateUrl: './user-create.html', styleUrl: './user-create.css' })
export class UserCreate {
  private readonly auth = inject(AuthService);
  protected readonly form = new FormGroup({
    nome: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    login: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    senha: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });
  protected readonly enviando = signal(false);
  protected readonly mensagem = signal('');
  protected readonly erro = signal('');

  protected cadastrar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true); this.erro.set(''); this.mensagem.set('');
    this.auth.createUser(this.form.getRawValue()).subscribe({
      next: (result) => { this.mensagem.set(result.message); this.form.reset(); this.enviando.set(false); },
      error: (error: HttpErrorResponse) => { this.erro.set(error.error?.message ?? 'Não foi possível cadastrar o usuário.'); this.enviando.set(false); },
    });
  }
}
