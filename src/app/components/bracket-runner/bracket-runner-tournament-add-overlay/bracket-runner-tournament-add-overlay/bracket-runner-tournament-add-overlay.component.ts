
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BracketRunnerService, TournamentData, OnboardTournamentData } from '../../../../services/bracket-runner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bracket-runner-tournament-add-overlay',
  imports: [CommonModule, FormsModule],
  templateUrl: './bracket-runner-tournament-add-overlay.component.html',
  styleUrls: ['./bracket-runner-tournament-add-overlay.component.css']
})
export class BracketRunnerTournamentAddOverlayComponent implements OnChanges {
  @Input() OnboardTournamentData!: OnboardTournamentData
  @Output() back = new EventEmitter<void>();
  errorMessage: string = '';
  loading: boolean = false;
  tournamentIds: number[] = [];
  userId: number = 0;
  orgId: number = 0;

  constructor(private bracketRunnerService: BracketRunnerService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['tournamentData']){
    }
  }
  goBack(): void {
    this.back.emit();
  }

  onAddSubmit(): void {
    this.errorMessage = '';
    this.loading = true;

    this.bracketRunnerService.addTournamentToRunnerBoard(this.tournamentIds, this.userId, this.orgId)
    .subscribe({
      next: (response) => {
        if(response.status === 200)
          this.loading = false;
        this.goBack();
      },
      error: (error) => {

      }
    });
  }
  onUpload(): void {
    this.errorMessage = '';
    this.loading = true;

    this.bracketRunnerService.uploadTournamentStandingsToLeague(this.tournamentIds, this.OnboardTournamentData.eventUrlSlug,
      this.OnboardTournamentData.leagueId, this.OnboardTournamentData.gameIds, this.OnboardTournamentData.open)
      .subscribe({
        next: (response) => {
          if(response.status === 200)
            this.loading = false;
          this.goBack();
        },
        error: (error) => {

        }
      });
  }
}
