import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, output, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subscription, exhaustMap, finalize, switchMap, take, takeWhile, timer } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { startggDebug } from '../../../shared/startgg-debug';
import { apiErrorMessage } from '../../../shared/api-error';

@Component({
  selector: 'app-startgg-link',
  standalone: true,
  templateUrl: './startgg-link.component.html',
  styleUrl: '../user-register/user-register.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class StartggLinkComponent {
  readonly users = inject(UserService);
  readonly linked = output<void>();
  private readonly destroyRef = inject(DestroyRef);
  private pending?: Subscription;
  private statusRequest?: Subscription;
  private popup: Window | null = null;
  loading = false;
  verifying = false;
  error = '';
  message = '';

  constructor() {
    effect(() => {
      const account = this.users.account();
      untracked(() => {
        this.cancel();
        if (account) this.checkStatus();
      });
    });
    this.destroyRef.onDestroy(() => this.cancel());
  }

  checkStatus(): void {
    this.statusRequest?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.message = '';
    startggDebug('Checking link availability');
    this.statusRequest = this.users.loadStartggLink().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false))
      .subscribe({
        next: status => startggDebug(status.enabled ? 'Linking available' : 'Linking unavailable: backend OAuth configuration is incomplete', { enabled: status.enabled, linked: !!status.link }),
        error: error => {
          startggDebug('Link status request failed', undefined, error);
          this.error = apiErrorMessage(error, 'Unable to check your Start.gg link.');
        }
      });
  }

  verify(): void {
    startggDebug('Link button activated', { signedIn: !!this.users.account(), enabled: !!this.users.startgg()?.enabled, loading: this.loading, verifying: this.verifying });
    if (this.loading || this.verifying || !this.users.account() || !this.users.startgg()?.enabled) {
      startggDebug('Link attempt skipped: account or availability is not ready');
      return;
    }
    // Open synchronously from the click so browsers do not block the consent window.
    try {
      this.popup = window.open('about:blank', '_blank', 'popup,width=620,height=760');
      if (this.popup) this.popup.opener = null;
    } catch {
      startggDebug('Browser could not open the consent window');
      this.closePopup();
      this.error = 'Unable to open Start.gg. Allow popups for Sengoku, then try again.';
      return;
    }
    if (!this.popup) {
      startggDebug('Consent popup blocked by browser');
      this.error = 'Allow popups for Sengoku, then try linking again.';
      return;
    }
    startggDebug('Consent popup opened; preparing authorization');
    this.verifying = true;
    this.error = '';
    this.message = 'Finish signing in to Start.gg in the new window. You can close it after the confirmation appears.';
    let success = false;
    this.pending = this.users.authorizeStartgg().pipe(
      switchMap(result => {
        startggDebug('Authorization response received');
        const url = new URL(result.authorizationUrl);
        if (url.protocol !== 'https:' || !['start.gg', 'www.start.gg', 'api.start.gg'].includes(url.hostname) ||
            url.username || url.password || url.port) throw new Error('The verification link was not valid.');
        if (!this.popup || this.popup.closed) return EMPTY;
        this.popup.location.href = url.href;
        startggDebug('Consent window navigated to Start.gg; polling for verified link');
        return timer(0, 5000).pipe(
          exhaustMap(() => this.users.loadStartggLink()),
          // Check the server one last time even if the consent window just closed.
          takeWhile(status => !status.link && !!this.popup && !this.popup.closed, true),
          take(121)
        );
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        startggDebug(success ? 'Link verification completed' : 'Link verification stopped without completion');
        this.verifying = false;
        this.closePopup();
        if (!success && !this.error) this.message = 'Linking was not completed. You can try again or continue without it.';
      })
    ).subscribe({
      next: status => {
        startggDebug('Link poll completed', { linked: !!status.link, enabled: status.enabled, popupClosed: !this.popup || this.popup.closed });
        if (!status.link) return;
        success = true;
        this.users.refreshAfterLink().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => { startggDebug('Account refreshed after verified linking'); this.message = 'Your Start.gg account is linked.'; this.linked.emit(); },
          error: error => { startggDebug('Account refresh failed after linking', undefined, error); this.error = apiErrorMessage(error, 'The link was saved, but your account could not be refreshed. Sign in again.'); }
        });
      },
      error: error => { startggDebug('Link authorization or polling failed', undefined, error); this.message = ''; this.error = apiErrorMessage(error, 'Start.gg linking could not be completed. Please try again.'); }
    });
  }

  cancel(): void {
    if (this.verifying) startggDebug('Linking cancelled by user, navigation, or account change');
    this.statusRequest?.unsubscribe();
    this.pending?.unsubscribe();
    this.closePopup();
    this.verifying = false;
  }

  private closePopup(): void {
    if (this.popup && !this.popup.closed) this.popup.close();
    this.popup = null;
  }
}
