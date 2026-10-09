import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { UserRegisterComponent } from './user-register.component';

describe('User registration', () => {
  let fixture: ComponentFixture<UserRegisterComponent>;
  let users: jasmine.SpyObj<UserService>;
  beforeEach(async () => {
    users = jasmine.createSpyObj('UserService', ['createNewUser', 'previewStartggProfile']);
    await TestBed.configureTestingModule({
      imports: [UserRegisterComponent],
      providers: [provideRouter([]), { provide: UserService, useValue: users }]
    }).compileComponents();
    fixture = TestBed.createComponent(UserRegisterComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  async function fill(password: string, confirmation: string): Promise<NgForm> {
    Object.assign(fixture.componentInstance, { userName: 'Oni_Shogi', email: 'oni@example.com', password, confirmPassword: confirmation });
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
  }

  it('prevents submission when passwords differ', async () => {
    fixture.componentInstance.register(await fill('password123', 'different'));
    expect(users.createNewUser).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage).toContain('matching passwords');
  });

  it('clears passwords after success and does not claim the profile is linked', async () => {
    users.createNewUser.and.returnValue(of('Created'));
    fixture.componentInstance.register(await fill('password123', 'password123'));
    fixture.detectChanges();
    expect(fixture.componentInstance.password).toBe('');
    expect(fixture.componentInstance.confirmPassword).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Account created');
    expect(fixture.nativeElement.textContent).toContain('linking are not available yet');
    expect(users.previewStartggProfile).not.toHaveBeenCalled();
  });

  it('recovers after registration failure without showing success', async () => {
    users.createNewUser.and.returnValue(throwError(() => new Error('Try again')));
    fixture.componentInstance.register(await fill('password123', 'password123'));
    expect(fixture.componentInstance.accountCreated).toBeFalse();
    expect(fixture.componentInstance.saving).toBeFalse();
    expect(fixture.componentInstance.errorMessage).toBe('Try again');
  });
});
