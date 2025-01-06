import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserData, UserService } from '../../../services/user.service';

@Component({
  selector: 'app-user-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css',
  standalone: true
})
export class UserRegisterComponent implements OnChanges{
  @Output() back = new EventEmitter<void>();
  errorMessage: string = '';
  loading: boolean = false;
  loggedin: boolean = false;
  newUser: UserData = { UserId: 0 , UserName: '', Display: '', Password: '', Email:'', permissionChecksum: ''};
  confirmPass: string = '';

  constructor(private UserService: UserService) { }
  ngOnChanges(changes: SimpleChanges): void {
    if(!this.loggedin) {
      this.getCreateNewUserForm();
    }
  }

  goBack(): void {
    this.back.emit();
  }

  getCreateNewUserForm(): void  {
    this.errorMessage = '';
    this. loading = false;

    //ToDO: Register Templates
  }
  sendNewRegisteredUser(userName: string, display: string, email: string,
    password: string) : void {
      this.errorMessage = '';
      this.loading = true;

      this.UserService.createNewUser(userName, display, email, password)
      .subscribe();
    }
}
