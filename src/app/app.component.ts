import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService } from './services/user.service';
import { apiErrorMessage } from './shared/api-error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AppComponent implements OnInit {
  readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  signingOut = false;
  accountError = '';

  ngOnInit(): void {
    this.users.initialize().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
  }

  retrySession(): void {
    this.users.restoreSession().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => {} });
  }

  logout(): void {
    if (this.signingOut) return;
    this.signingOut = true;
    this.accountError = '';
    this.users.logout().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.signingOut = false)).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: error => this.accountError = apiErrorMessage(error, 'Sign-out could not be confirmed. Please try again.')
    });
  }
}
