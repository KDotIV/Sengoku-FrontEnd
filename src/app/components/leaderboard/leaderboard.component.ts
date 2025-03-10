import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap } from 'rxjs';
import { LeagueService, LeagueTournamentData, LeagueByOrgData } from '../../services/league.service';
import { Router, RouterModule } from '@angular/router';
import { LeagueStateService } from '../../services/LeagueStateService.service';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  title = 'Leaderboards';
  leagues: number[] = [];
  leagueId: number = 0;
  userId: number = 0;
  leagueEvents: LeagueTournamentData[] = [];
  availableLeagues: LeagueByOrgData[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  selectedLeague: LeagueByOrgData | null = null;
  
  constructor(private leagueState: LeagueStateService, private leagueService: LeagueService, private router: Router){ }

  ngOnInit(): void {
    this.getAvailableLeagues();
  }
  addLeagueToUser(): void {
    this.leagueService.addLeagueToUser(this.leagueId, this.userId)
  }
  selectLeague(league: LeagueByOrgData): void {
    this.leagueState.setSelectedLeague(league);
    this.router.navigate(['/leaderboards', league.leagueId]);
  }
  clearSelection(): void {
    this.selectedLeague = null;
  }
  getAvailableLeagues(): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryAvailableLeagues()
    .pipe(
      tap((data: LeagueByOrgData[]) => {
        this.availableLeagues = data;
        this.loading = false;
        if(data.length === 0) {
          this.errorMessage = 'No Leagues are available to register';
        } else {
          this.errorMessage = '';
        }
      }),
      catchError(error => {
        console.error('Failed to load Leagues', error);
          this.errorMessage = 'Failed to load League Events';
          this.loading = false;
          return EMPTY;
      })
    ).subscribe();
  }
}
