import { Component, Input, Output, EventEmitter, SimpleChange, SimpleChanges, OnChanges } from '@angular/core';
import { LeagueByOrgData, LeagueService, LeagueTournamentData } from '../../../services/league.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-league-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './league-details.component.html',
  styleUrl: './league-details.component.css',
  standalone: true,
})
export class LeagueDetailsComponent implements OnChanges {
  @Input() league!: LeagueByOrgData;
  @Output() back = new EventEmitter<void>();
  leagueEvents: LeagueTournamentData[] = [];
  errorMessage: string = '';
  loading: boolean = false;

  goBack(): void {
    this.back.emit();
  }
  constructor(private leagueService: LeagueService){ }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['league'] && changes['league'].currentValue) {
      console.log(this.league.leagueId);
      this.getLeagueSchedule(this.league.leagueId);
    }
  }
  
  getLeagueSchedule(leagueId: number): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryTournamentsByLeague([leagueId])
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