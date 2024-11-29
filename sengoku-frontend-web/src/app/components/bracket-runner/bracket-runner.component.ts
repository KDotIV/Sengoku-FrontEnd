import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TournamentBoardService, TournamentBoardResult } from '../../services/tournament-board.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-bracket-runner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bracket-runner.component.html',
    styleUrls: ['./bracket-runner.component.css']
})
export class BracketRunnerComponent implements OnInit {

  tournamentBoardResults$: Observable<TournamentBoardResult[]> = new Observable();
  selectedTournament: TournamentBoardResult | null = null;  // Declare the selectedTournament property

  constructor(private tournamentBoardService: TournamentBoardService) { }

  ngOnInit(): void {
    this.tournamentBoardResults$ = this.tournamentBoardService.getTournamentBoard();
  }

  // Define the selectTournament method
  selectTournament(tournament: TournamentBoardResult): void {
    this.selectedTournament = this.selectedTournament === tournament ? null : tournament;
  }
}
