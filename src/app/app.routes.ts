import { Routes } from '@angular/router';
import { BracketRunnerComponent } from './components/bracket-runner/bracket-runner.component';
import { HomeComponent } from './components/home/home.component'; 
import { CoOpComponent } from './components/co-op/co-op.component';

export const routes: Routes = [
  { path: 'bracket-runner', component: BracketRunnerComponent },
  { path: 'co-op', component: CoOpComponent},
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' }, // Fallback route
];
