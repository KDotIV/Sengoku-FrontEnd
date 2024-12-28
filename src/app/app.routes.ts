import { Routes } from '@angular/router';
import { BracketRunnerComponent } from './components/bracket-runner/bracket-runner.component';
import { HomeComponent } from './components/home/home.component'; 
import { CoOpComponent } from './components/co-op/co-op.component';
import { TournamentFinderComponent } from './components/tournament-finder/tournament-finder.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';

export const routes: Routes = [
  { path: 'tournament-finder', component: TournamentFinderComponent},
  { path: 'leaderboards', component: LeaderboardComponent },
  { path: 'bracket-runner', component: BracketRunnerComponent },
  { path: 'co-op', component: CoOpComponent},
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' }, // Fallback route
];
