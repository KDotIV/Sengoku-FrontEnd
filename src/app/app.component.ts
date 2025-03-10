import { Component, OnInit} from '@angular/core';
import { RouterOutlet, RouterModule, Router, RouterEvent, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { UserLoginComponent } from "./components/user/user-login/user-login.component";
import { UserRegisterComponent } from "./components/user/user-register/user-register.component";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, RouterModule, CommonModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log('NavigationStart:', event.url);
      } else if (event instanceof NavigationEnd) {
        console.log('NavigationEnd:', event.urlAfterRedirects);
      } else if (event instanceof NavigationCancel) {
        console.warn('NavigationCancel:', event.reason);
      } else if (event instanceof NavigationError) {
        console.error('NavigationError:', event.error);
      } else {
        // Possibly RouteConfigLoadStart or another event type
        console.log('Some other event:', event);
      }
    });
  }
  title = 'Sengoku';
}
