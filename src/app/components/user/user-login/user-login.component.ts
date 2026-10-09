import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-login',
  imports: [RouterLink],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class UserLoginComponent {}
