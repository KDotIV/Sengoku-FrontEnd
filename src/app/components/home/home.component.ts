import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EventLocationService, AddressEventResult } from '../../services/event-location.service';
import { LeagueByOrgData, LeagueService } from '../../services/league.service';
import { PlayerBracketService } from '../../services/player-bracket.service';
import { BracketVictoryPathData } from '../../services/bracket-runner.models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink],
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class HomeComponent implements OnInit {
  readonly users = inject(UserService);
  private readonly eventsApi = inject(EventLocationService);
  private readonly leaguesApi = inject(LeagueService);
  private readonly brackets = inject(PlayerBracketService);
  private readonly destroyRef = inject(DestroyRef);
  zipcode = '';
  events: AddressEventResult[] = [];
  leagues: LeagueByOrgData[] = [];
  paths: BracketVictoryPathData[] = [];
  finding = false;
  found = false;
  leaguesLoading = true;
  pathsLoading = false;
  eventError = '';
  leagueError = '';
  pathError = '';

  constructor() {
    effect(onCleanup => {
      const account = this.users.account();
      untracked(() => { this.paths = []; this.pathError = ''; });
      if (account) {
        this.pathsLoading = true;
        const request = this.brackets.getPaths(account.playerId).pipe(finalize(() => this.pathsLoading = false))
          .subscribe({
            next: paths => this.paths = paths.filter(path => path.lifecycle !== 'Completed').slice(0, 3),
            error: () => this.pathError = 'Your paths could not be loaded. Open BracketRunner to retry.'
          });
        onCleanup(() => request.unsubscribe());
      }
    });
  }

  ngOnInit(): void {
    this.leaguesApi.queryAvailableLeagues().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.leaguesLoading = false))
      .subscribe({
        next: leagues => this.leagues = leagues.slice(0, 3),
        error: () => this.leagueError = 'League previews are unavailable right now.'
      });
  }

  findEvents(form: NgForm): void {
    if (this.finding) return;
    this.eventError = '';
    if (form.invalid || !/^\d{5}$/.test(this.zipcode)) { this.eventError = 'Enter a five-digit ZIP code.'; return; }
    this.finding = true;
    this.events = [];
    this.eventsApi.queryEventsByLocation(this.zipcode, [], ['local'])
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.finding = false)).subscribe({
        next: events => { this.events = events.slice(0, 3); this.found = true; },
        error: () => this.eventError = 'Events could not be loaded. Please try again.'
      });
  }
}
