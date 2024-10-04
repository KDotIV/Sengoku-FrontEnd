import { Routes } from '@angular/router';
import { BracketRunnerComponent } from './components/bracket-runner/bracket-runner.component';

export const routes: Routes = [
  { path: 'bracket-runner', component: BracketRunnerComponent },
  { path: '', redirectTo: '/bracket-runner', pathMatch: 'full' },
];
