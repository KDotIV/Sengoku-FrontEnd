import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, EMPTY, tap } from 'rxjs';
import { LeagueService, LeagueTournamentData } from '../../services/league.service';

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
  leagueEvenets: LeagueTournamentData[] = [];
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private leageService: LeagueService){ }

  ngOnInit(): void {
    this.getLeagueSchedule();
  }
  getLeagueSchedule(): void {
    this.errorMessage = '';
    this.loading = true;

    this.leageService.queryTournamentsByLeague(this.leagues)
      .pipe(
        tap((data: LeagueTournamentData[]) => {
          console.log('Events Data', data);
          this.leagueEvenets = data;
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
