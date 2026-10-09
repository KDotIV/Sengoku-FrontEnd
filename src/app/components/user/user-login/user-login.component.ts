import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { apiErrorMessage } from '../../../shared/api-error';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './user-login.component.html',
  styleUrl: '../user-register/user-register.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class UserLoginComponent {
  readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  email = '';
  password = '';
  busy = false;
  error = '';

  login(form: NgForm): void {
    if (this.busy) return;
    this.error = '';
    if (form.invalid) { this.error = 'Enter your email and password.'; return; }
    this.busy = true;
    this.users.login(this.email, this.password).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => { this.busy = false; this.password = ''; })
    ).subscribe({
      next: () => {
        const requested = this.route.snapshot.queryParamMap.get('returnTo');
        const destination = requested && ['/bracket-runner', '/user-register', '/account'].includes(requested) ? requested : '/';
        void this.router.navigateByUrl(destination);
      },
      error: error => this.error = apiErrorMessage(error, 'Unable to sign in. Check your email and password and try again.')
    });
  }
}
