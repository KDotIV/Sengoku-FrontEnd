import { Routes } from '@angular/router';
import { BracketRunnerComponent } from './components/bracket-runner/bracket-runner.component';
import { HomeComponent } from './components/home/home.component'; 

export const routes: Routes = [
  { path: 'bracket-runner', component: BracketRunnerComponent },
  { path: '', component: HomeComponent },
];
