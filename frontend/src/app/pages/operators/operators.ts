import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, OperatorRecord } from '../../services/auth.service';

@Component({
  selector: 'app-operators',
  imports: [ReactiveFormsModule],
  templateUrl: './operators.html',
  styleUrl: './operators.css',
})
export class Operators implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly operators = signal<OperatorRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(40)] }),
    fullName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(160)] }),
  });

  ngOnInit(): void {
    this.loadOperators();
  }

  protected loadOperators(): void {
    this.loading.set(true);
    this.auth.listOperators().subscribe({
      next: (operators) => {
        this.operators.set(operators);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.message ?? 'Não foi possível carregar os operadores.');
        this.loading.set(false);
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    this.auth.saveOperator(this.form.getRawValue()).subscribe({
      next: (result) => {
        this.message.set(result.message);
        this.form.reset();
        this.saving.set(false);
        this.loadOperators();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.message ?? 'Não foi possível salvar o operador.');
        this.saving.set(false);
      },
    });
  }
}
