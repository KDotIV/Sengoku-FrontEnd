import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { UserService, AccountIdentity, StartggLinkStatus } from '../../../services/user.service';
import { UserRegisterComponent } from './user-register.component';

describe('Two-step registration', () => {
  let fixture: ComponentFixture<UserRegisterComponent>;
  let users: ReturnType<typeof mockUsers>;
  function mockUsers() {
    return {
      account: signal<AccountIdentity | null>(null), ready: signal(true), startgg: signal<StartggLinkStatus | null>(null),
      createNewUser: jasmine.createSpy().and.returnValue(of({ userId: 1, playerId: 42, response: 'Created' })),
      login: jasmine.createSpy().and.callFake(() => {
        const account = { userId: 1, playerId: 42, userName: 'Oni_Shogi' };
        users.account.set(account); return of(account);
      }),
      loadStartggLink: jasmine.createSpy().and.returnValue(of({ enabled: false, link: null }))
    };
  }
  beforeEach(async () => {
    users = mockUsers();
    await TestBed.configureTestingModule({ imports: [UserRegisterComponent], providers: [
      provideRouter([]), { provide: UserService, useValue: users }
    ] }).compileComponents();
    fixture = TestBed.createComponent(UserRegisterComponent);
    fixture.detectChanges(); await fixture.whenStable();
  });
  async function fill(password: string, confirmation = password): Promise<NgForm> {
    Object.assign(fixture.componentInstance, { userName: 'Oni_Shogi', email: 'oni@example.com', password, confirmPassword: confirmation });
    fixture.detectChanges(); await fixture.whenStable();
    return fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
  }

  it('requires a matching password of at least twelve characters', async () => {
    fixture.componentInstance.register(await fill('short'));
    expect(users.createNewUser).not.toHaveBeenCalled();
    fixture.componentInstance.register(await fill('long password!', 'different'));
    expect(users.createNewUser).not.toHaveBeenCalled();
  });

  it('creates then logs in, clears passwords, and offers optional linking only afterwards', async () => {
    expect(fixture.nativeElement.querySelector('app-startgg-link')).toBeNull();
    fixture.componentInstance.register(await fill('long password!'));
    fixture.detectChanges();
    expect(users.createNewUser).toHaveBeenCalledBefore(users.login);
    expect(fixture.componentInstance.password).toBe('');
    expect(fixture.componentInstance.confirmPassword).toBe('');
    expect(fixture.nativeElement.querySelector('app-startgg-link')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Skip for now');
  });

  it('completes without Start.gg and goes to the feature landing page', () => {
    const navigation = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.componentInstance.finish();
    expect(navigation).toHaveBeenCalledWith('/');
  });

  it('never repeats successful registration when automatic login fails', async () => {
    users.login.and.returnValue(throwError(() => new Error('offline')));
    fixture.componentInstance.register(await fill('long password!'));
    fixture.detectChanges();
    expect(fixture.componentInstance.accountCreated).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Sign in to continue');
    expect(fixture.nativeElement.querySelector('#password')).toBeNull();
  });
});
