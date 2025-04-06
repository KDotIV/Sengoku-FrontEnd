import { Routes } from '@angular/router';
import { BracketRunnerComponent } from './components/bracket-runner/bracket-runner.component';
import { HomeComponent } from './components/home/home.component'; 
import { CoOpComponent } from './components/co-op/co-op.component';
import { TournamentFinderComponent } from './components/tournament-finder/tournament-finder.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { UserRegisterComponent } from './components/user/user-register/user-register.component';
import { UserLoginComponent } from './components/user/user-login/user-login.component';
import { LeagueDetailsComponent } from './components/leaderboard/league-details/league-details.component';
import { LeagueRegisterComponent } from './components/leaderboard/league-register/league-register.component';

export const routes: Routes = [
  {
    path: 'leaderboards',
    component: LeaderboardComponent,
    children: [
      { path: ':leagueId', component: LeagueDetailsComponent },
      { path: ':leagueId/register', component: LeagueRegisterComponent }
    ]
  },
  { path: 'tournament-finder', component: TournamentFinderComponent },
  { path: 'bracket-runner', component: BracketRunnerComponent },
  { path: 'co-op', component: CoOpComponent },
  { path: 'user-register', component: UserRegisterComponent },
  { path: 'user-login', component: UserLoginComponent },
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' }
];