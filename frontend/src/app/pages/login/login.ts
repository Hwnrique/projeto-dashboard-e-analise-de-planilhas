import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loginForm = new FormGroup({
    login: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    senha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected readonly mensagem = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected entrar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.erro.set('');
    this.mensagem.set('');
    this.enviando.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.mensagem.set(response.message);
        this.enviando.set(false);
        void this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        this.erro.set(error.error?.message ?? 'Nao foi possivel conectar ao servidor. Tente novamente.');
        this.enviando.set(false);
      },
    });
  }
}
