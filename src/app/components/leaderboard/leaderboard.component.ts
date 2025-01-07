import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap } from 'rxjs';
import { LeagueService, LeagueTournamentData, LeagueByOrgData } from '../../services/league.service';
import { LeagueDetailsComponent } from './league-details/league-details.component';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, FormsModule, LeagueDetailsComponent],
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
  constructor(private leagueService: LeagueService){ }

  ngOnInit(): void {
    this.getAvailableLeagues();
  }
  addLeagueToUser(): void {
    this.leagueService.addLeagueToUser(this.leagueId, this.userId)
  }
  selectLeague(league: LeagueByOrgData): void {
    this.selectedLeague = league;
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
