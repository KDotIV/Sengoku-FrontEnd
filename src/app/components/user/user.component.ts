import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StartggLinkComponent } from './startgg-link/startgg-link.component';

@Component({
  selector: 'app-user',
  imports: [RouterLink, StartggLinkComponent],
  templateUrl: './user.component.html',
  styleUrl: './user-register/user-register.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class UserComponent {
  readonly users = inject(UserService);
}
