import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap } from 'rxjs';
import { LeagueService, LeagueTournamentData, LeagueByOrgData } from '../../services/league.service';

@Component({
  selector: 'app-leaderboard',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent implements OnInit {
  title = 'LeaderBoards';
  leagues: number[] = [];
  leagueId: number = 0;
  userId: number = 0;
  leagueEvents: LeagueTournamentData[] = [];
  availableLeagues: LeagueByOrgData[] = [];
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private leagueService: LeagueService){ }

  ngOnInit(): void {
    this.getLeagueSchedule();
    this.getAvailableLeagues();
  }
  addLeagueToUser(): void {
    this.leagueService.addLeagueToUser(this.leagueId, this.userId)
  }
  getAvailableLeagues(): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryAvailableLeagues()
    .pipe(
      tap((data: LeagueByOrgData[]) => {
        console.log('League Data', data);
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
  getLeagueSchedule(): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryTournamentsByLeague(this.leagues)
      .pipe(
        tap((data: LeagueTournamentData[]) => {
          console.log('Events Data', data);
          this.leagueEvents = data;
          this.loading = false;
          if(data.length === 0) {
            this.errorMessage = 'No Events found for the given League Id';
          } else {
            this.errorMessage = '';
          }
        }),
        catchError(error => {
          console.error('Failed to load League Events', error);
          this.errorMessage = 'Failed to load League Events';
          this.loading = false;
          return EMPTY;
        })
      ).subscribe();
  }
}
