import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TournamentBoardService, TournamentBoardResult } from '../../services/tournament-board.service';

@Component({
  selector: 'app-bracket-runner',
  standalone: true,
  imports: [CommonModule],  // Import CommonModule here
  templateUrl: './bracket-runner.component.html',
  styleUrls: ['./bracket-runner.component.css']
})
export class BracketRunnerComponent implements OnInit {

  tournamentBoardResults: TournamentBoardResult[] = [];
  selectedTournament: TournamentBoardResult | null = null;

  constructor(private tournamentBoardService: TournamentBoardService) { }

  ngOnInit(): void {
    this.loadTournamentBoard();
  }

  loadTournamentBoard(): void {
    this.tournamentBoardService.getTournamentBoard().subscribe(
      (data) => this.tournamentBoardResults = data,
      (error) => console.error('Failed to load tournament board', error)
    );
  }

  selectTournament(tournament: TournamentBoardResult): void {
    this.selectedTournament = this.selectedTournament === tournament ? null : tournament;
  }
}
