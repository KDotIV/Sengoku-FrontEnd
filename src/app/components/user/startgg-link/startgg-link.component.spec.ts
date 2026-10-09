import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { UserService, StartggLinkStatus } from '../../../services/user.service';
import { StartggLinkComponent } from './startgg-link.component';

describe('Start.gg consent window', () => {
  const link = { userId: 1, playerId: 99, startggUserId: 8, startggPlayerId: 9, slug: 'user/oni', verifiedAt: '2026-10-09' };
  function setup() {
    const users = {
      account: signal({ userId: 1, playerId: 42, userName: 'Oni' }),
      startgg: signal<StartggLinkStatus | null>({ enabled: true, link: null }),
      loadStartggLink: jasmine.createSpy().and.returnValue(of({ enabled: true, link: null })),
      authorizeStartgg: jasmine.createSpy().and.returnValue(of({ authorizationUrl: 'https://start.gg/oauth/authorize?state=server-owned' })),
      refreshAfterLink: jasmine.createSpy().and.returnValue(of({ enabled: true, link }))
    };
    TestBed.configureTestingModule({ imports: [StartggLinkComponent], providers: [{ provide: UserService, useValue: users }] });
    const fixture = TestBed.createComponent(StartggLinkComponent);
    fixture.detectChanges();
    const popup = { closed: false, opener: {}, location: { href: '' }, close: jasmine.createSpy() };
    popup.close.and.callFake(() => popup.closed = true);
    return { users, fixture, popup };
  }

  it('handles blocked popups without initiating OAuth', () => {
    const { users, fixture } = setup();
    spyOn(window, 'open').and.returnValue(null);
    fixture.componentInstance.verify();
    expect(users.authorizeStartgg).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error).toContain('Allow popups');
  });

  it('uses the server link status, refreshes the adopted identity, and closes the popup', fakeAsync(() => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    users.loadStartggLink.and.returnValue(of({ enabled: true, link }));
    fixture.componentInstance.verify();
    tick(0);
    expect(popup.location.href).toContain('https://start.gg/oauth/authorize');
    expect(popup.opener).toBeNull();
    expect(users.refreshAfterLink).toHaveBeenCalledTimes(1);
    expect(popup.closed).toBeTrue();
    expect(fixture.componentInstance.verifying).toBeFalse();
  }));

  it('stops after the user closes the consent popup without assuming success', fakeAsync(() => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    fixture.componentInstance.verify();
    tick(0);
    popup.closed = true;
    tick(5000);
    expect(users.refreshAfterLink).not.toHaveBeenCalled();
    expect(fixture.componentInstance.verifying).toBeFalse();
    expect(fixture.componentInstance.message).toContain('not completed');
  }));

  it('cancels polling on navigation or cancellation', fakeAsync(() => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    fixture.componentInstance.verify(); tick(0);
    const count = users.loadStartggLink.calls.count();
    fixture.destroy(); tick(15000);
    expect(users.loadStartggLink.calls.count()).toBe(count);
    expect(popup.closed).toBeTrue();
  }));

  it('rejects authorization URLs outside Start.gg', () => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    users.authorizeStartgg.and.returnValue(of({ authorizationUrl: 'https://evil.test/oauth' }));
    fixture.componentInstance.verify();
    expect(popup.location.href).toBe('');
    expect(fixture.componentInstance.error).toContain('not valid');
    expect(popup.closed).toBeTrue();
  });

  it('shows only unavailable messaging and a recheck action when disabled', () => {
    const { users, fixture } = setup();
    users.startgg.set({ enabled: false, link: null });
    fixture.detectChanges();
    const view = fixture.nativeElement as HTMLElement;
    expect(view.textContent).toContain('temporarily unavailable');
    expect(view.textContent).not.toContain('Link your Start.gg account to import');
    expect(view.textContent).not.toContain('Link Start.gg account');
    const open = spyOn(window, 'open');
    fixture.componentInstance.verify();
    expect(open).not.toHaveBeenCalled();
    (view.querySelector('button') as HTMLButtonElement).click();
    expect(users.loadStartggLink).toHaveBeenCalledTimes(2);
  });

  it('shows only the loading message while availability is being checked', () => {
    const { users, fixture } = setup();
    const response = new Subject<StartggLinkStatus>();
    users.loadStartggLink.and.returnValue(response);
    fixture.componentInstance.checkStatus();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Checking your Start.gg');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    response.complete();
  });

  it('starts OAuth through the rendered enabled link button', fakeAsync(() => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    tick(0);
    expect(users.authorizeStartgg).toHaveBeenCalledTimes(1);
    expect(popup.location.href).toContain('https://start.gg/oauth/authorize');
    fixture.destroy();
  }));

  it('reports authorization failure without leaving conflicting instructions or a blank popup', () => {
    const { users, fixture, popup } = setup();
    spyOn(window, 'open').and.returnValue(popup as unknown as Window);
    const log = spyOn(console, 'warn');
    users.authorizeStartgg.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503, error: { response: 'Start.gg verification is not configured.', secret: 'never-log-this' }
    })));
    fixture.componentInstance.verify();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Link your Start.gg account to import');
    expect(popup.closed).toBeTrue();
    expect(JSON.stringify(log.calls.allArgs())).toContain('503');
    expect(JSON.stringify(log.calls.allArgs())).not.toContain('never-log-this');
  });

  it('shows a recoverable message if opening the popup throws', () => {
    const { users, fixture } = setup();
    spyOn(window, 'open').and.throwError('Browser refused');
    fixture.componentInstance.verify();
    expect(fixture.componentInstance.error).toContain('Allow popups');
    expect(users.authorizeStartgg).not.toHaveBeenCalled();
  });
});
