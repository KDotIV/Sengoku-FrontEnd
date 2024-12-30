import { Component } from '@angular/core';
import { RouterOutlet, RouterModule} from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { UserLoginComponent } from "./components/user/user-login/user-login.component";
import { UserRegisterComponent } from "./components/user/user-register/user-register.component";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterModule, CommonModule, UserLoginComponent, UserRegisterComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Sengoku';
  showOverlay = false;

  toggleOverlay(): void {
    this.showOverlay = !this.showOverlay;
  }
}
