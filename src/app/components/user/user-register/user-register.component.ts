import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StartggProfilePreview, UserService } from '../../../services/user.service';
import { apiErrorMessage } from '../../../shared/api-error';
import { normalizeUserSlug } from '../../../shared/startgg-url';

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class UserRegisterComponent {
  private readonly users = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  userName = '';
  email = '';
  password = '';
  confirmPassword = '';
  profileSlug = '';
  profile: StartggProfilePreview['data'] = null;
  profileUrl = '';
  accountCreated = false;
  saving = false;
  lookingUp = false;
  errorMessage = '';
  profileError = '';

  register(form: NgForm): void {
    if (this.saving || this.accountCreated) return;
    this.errorMessage = '';
    if (form.invalid || !this.userName.trim() || this.password !== this.confirmPassword) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Enter a username, valid email, and matching passwords.';
      return;
    }
    this.saving = true;
    this.users.createNewUser({ userName: this.userName, email: this.email, password: this.password })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.accountCreated = true;
          this.password = '';
          this.confirmPassword = '';
        },
        error: error => this.errorMessage = apiErrorMessage(error,
          'Unable to create your account. The email may already be registered or your details may not be accepted.')
      });
  }

  previewProfile(): void {
    if (this.lookingUp) return;
    this.profileError = '';
    this.profile = null;
    let slug: string;
    try { slug = normalizeUserSlug(this.profileSlug); }
    catch (error) { this.profileError = apiErrorMessage(error, 'Check your Start.gg link.'); return; }
    this.lookingUp = true;
    this.users.previewStartggProfile(slug)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.lookingUp = false))
      .subscribe({
        next: result => {
          this.profile = result.data;
          this.profileUrl = `https://start.gg/${slug}`;
        },
        error: error => this.profileError = apiErrorMessage(error, 'Unable to load that Start.gg profile. Please try again.')
      });
  }
}
