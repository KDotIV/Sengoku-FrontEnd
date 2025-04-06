import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserData, UserService } from '../../../services/user.service';
import { LeagueByOrgData, LeagueService } from '../../../services/league.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-register.component.html',
  styleUrl: './user-register.component.css',
  standalone: true
})
export class UserRegisterComponent implements OnInit {
  @Output() back = new EventEmitter<void>();
  
  errorMessage: string = '';
  loading: boolean = false;
  loggedin: boolean = false;
  
  newUser: UserData = { UserId: 0, UserName: '', Display: '', Password: '', Email: '', permissionChecksum: '' };
  confirmPass: string = '';
  
  availableLeagues: LeagueByOrgData[] = [];

  // 1) Inject your LeagueService (or whatever can fetch the leagues)
  constructor(private userService: UserService, private leagueService: LeagueService, private router: Router) { }

  ngOnInit(): void {
    // If you have login checks or want to handle other logic, do that here
    if (!this.loggedin) {
      this.getCreateNewUserForm();
    }

    // 2) Fetch list of leagues
    this.fetchAvailableLeagues();
  }

  goBack(): void {
    this.back.emit();
  }

  getCreateNewUserForm(): void {
    this.errorMessage = '';
    this.loading = false;
    // Additional logic if needed
  }

  sendNewRegisteredUser(userName: string, display: string, email: string, password: string): void {
    this.errorMessage = '';
    this.loading = true;

    this.userService.createNewUser(userName, display, email, password).subscribe({
      next: (res) => {
        // handle success
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to create user.';
        this.loading = false;
      }
    });
  }

  // 3) Actually load leagues from your leagueService
  fetchAvailableLeagues(): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryAvailableLeagues().subscribe({
      next: (leagues: LeagueByOrgData[]) => {
        this.availableLeagues = leagues;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load leagues.';
        this.loading = false;
      }
    });
  }

  // 4) Either navigate or provide a link for each league
  onLeagueSelect(leagueId: number): void {
    // Navigate to /leaderboards/:leagueId/register
    this.router.navigate(['/leaderboards', leagueId, 'register']);
  }
}
