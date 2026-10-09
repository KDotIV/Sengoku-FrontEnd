import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap, tap } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { apiErrorMessage } from '../../../shared/api-error';
import { StartggLinkComponent } from '../startgg-link/startgg-link.component';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [FormsModule, RouterLink, StartggLinkComponent],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class UserRegisterComponent {
  readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  userName = '';
  email = '';
  password = '';
  confirmPassword = '';
  accountCreated = false;
  saving = false;
  errorMessage = '';

  register(form: NgForm): void {
    if (this.saving || this.accountCreated || this.users.account()) return;
    this.errorMessage = '';
    if (form.invalid || !this.userName.trim() || this.password.length < 12 || this.password.length > 1024 ||
        this.password !== this.confirmPassword) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Enter a username, valid email, and matching passwords of 12–1024 characters.';
      return;
    }
    this.saving = true;
    const email = this.email;
    const password = this.password;
    this.users.createNewUser({ userName: this.userName, email, password }).pipe(
      tap(() => { this.accountCreated = true; this.password = ''; this.confirmPassword = ''; }),
      switchMap(() => this.users.login(email, password)),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving = false)
    ).subscribe({
      error: error => this.errorMessage = this.accountCreated
        ? 'Your account was created, but sign-in could not be completed. Sign in to continue; you do not need to register again.'
        : apiErrorMessage(error, 'Unable to confirm registration. Please try signing in before submitting again.')
    });
  }

  finish(): void {
    void this.router.navigateByUrl('/');
  }
}
