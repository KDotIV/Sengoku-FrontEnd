import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { BracketVictoryPathData, PlayerLegend, PlayerOnboardResult, isCompleted, isPending } from '../../services/bracket-runner.models';
import { PlayerBracketService } from '../../services/player-bracket.service';
import { UserService } from '../../services/user.service';
import { apiErrorMessage } from '../../shared/api-error';
import { normalizeBracketUrl, normalizeTournamentSlug } from '../../shared/startgg-url';
import { PathListComponent } from './path-list.component';

@Component({
  selector: 'app-bracket-runner',
  standalone: true,
  imports: [FormsModule, RouterLink, PathListComponent],
  templateUrl: './bracket-runner.component.html',
  styleUrl: './bracket-runner.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class BracketRunnerComponent {
  readonly runner = inject(PlayerBracketService);
  readonly users = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private requests = new Subscription();
  private watcher?: Subscription;
  private searchRequest?: Subscription;
  private mineRequest?: Subscription;
  searchType: 'player' | 'tournament' = 'player';
  query = '';
  bracketUrl = '';
  paths: BracketVictoryPathData[] = [];
  myPaths: BracketVictoryPathData[] = [];
  legends: PlayerLegend[] = [];
  searching = false;
  searched = false;
  loadingMine = false;
  importing = false;
  watching = false;
  searchError = '';
  mineError = '';
  importError = '';
  linkError = '';
  legendError = '';
  progressMessage = '';
  showCompleted = false;

  constructor() {
    effect(onCleanup => {
      const ready = this.users.ready();
      const account = this.users.account();
      if (!ready) return;
      untracked(() => {
        this.requests.unsubscribe();
        this.requests = new Subscription();
        this.paths = []; this.myPaths = []; this.legends = [];
        this.query = ''; this.searched = false; this.searchError = ''; this.mineError = '';
        this.importError = ''; this.progressMessage = ''; this.linkError = ''; this.legendError = '';
        this.searchType = account ? 'tournament' : 'player';
        this.runner.setOwner(account);
        this.bracketUrl = this.runner.operation()?.bracketUrl ?? '';
        if (account) {
          this.loadMine();
          this.requests.add(this.users.loadStartggLink().subscribe({
            error: error => this.linkError = apiErrorMessage(error, 'Unable to check Start.gg verification. Open your account to try again.')
          }));
          if (this.runner.operation()?.status === 'Pending') this.resumeProgress();
        }
      });
      onCleanup(() => this.requests.unsubscribe());
    });
    this.destroyRef.onDestroy(() => this.requests.unsubscribe());
  }

  get visibleMyPaths(): BracketVictoryPathData[] {
    return this.myPaths.filter(path => this.showCompleted || path.lifecycle !== 'Completed')
      .slice().sort((a, b) => {
        const priority = (path: BracketVictoryPathData) => path.lifecycle === 'InProgress' ? 0 : path.lifecycle === 'Upcoming' ? 1 : path.lifecycle === 'Unknown' ? 2 : 3;
        return priority(a) - priority(b) || (a.startTime ? Date.parse(a.startTime) : Infinity) - (b.startTime ? Date.parse(b.startTime) : Infinity);
      });
  }

  search(): void {
    this.searchRequest?.unsubscribe();
    this.searchError = '';
    this.paths = [];
    this.searched = false;
    const type = this.users.account() ? 'tournament' : this.searchType;
    let query = this.query.trim();
    if (!query) { this.searchError = 'Enter a player name or tournament event slug.'; return; }
    if (type === 'tournament') {
      try { query = normalizeTournamentSlug(query); }
      catch (error) { this.searchError = apiErrorMessage(error, 'Check your event slug.'); return; }
    }
    this.searching = true;
    this.searchRequest = (type === 'player' ? this.runner.searchByName(query) : this.runner.searchByTournament(query))
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.searching = false)).subscribe({
        next: paths => { this.paths = paths; this.searched = true; },
        error: error => this.searchError = apiErrorMessage(error, 'Unable to search stored tournament paths. Please try again.')
      });
    this.requests.add(this.searchRequest);
  }

  loadMine(): void {
    const account = this.users.account();
    if (!account) return;
    this.mineRequest?.unsubscribe();
    this.loadingMine = true;
    this.mineError = '';
    this.mineRequest = this.runner.getPaths(account.playerId).pipe(finalize(() => this.loadingMine = false)).subscribe({
      next: paths => this.myPaths = paths,
      error: error => this.mineError = apiErrorMessage(error, 'Unable to load your tournament paths.')
    });
    this.requests.add(this.mineRequest);
    this.requests.add(this.runner.getLegend(account.playerId).subscribe({
      next: legends => { this.legends = legends; this.legendError = ''; },
      error: () => this.legendError = 'Your Legend history could not be loaded. Refresh to try again.'
    }));
  }

  importBracket(): void {
    if (this.importing || this.watching || this.runner.operation() || !this.users.account() || !this.users.startgg()?.link) return;
    this.importError = '';
    let url: string;
    try { url = normalizeBracketUrl(this.bracketUrl); }
    catch (error) { this.importError = apiErrorMessage(error, 'Check the bracket link.'); return; }
    this.bracketUrl = url;
    this.importing = true;
    this.requests.add(this.runner.onboard(url).pipe(finalize(() => this.importing = false)).subscribe({
      next: result => this.handleResult(result),
      error: error => this.importError = apiErrorMessage(error, 'Import could not be confirmed. Refresh your paths before submitting again.')
    }));
  }

  retryImport(): void {
    const job = this.runner.operation();
    if (!job || this.importing || this.watching || !this.users.startgg()?.link) return;
    this.importing = true;
    this.importError = '';
    this.requests.add(this.runner.retry(job.operationId).pipe(finalize(() => this.importing = false)).subscribe({
      next: result => this.handleResult(result),
      error: error => this.operationError(error)
    }));
  }

  resumeProgress(): void {
    const job = this.runner.operation();
    if (!job || this.watching) return;
    this.importError = '';
    this.watching = true;
    this.progressMessage = 'Preparing your Legend and opponent data. This may take several minutes.';
    this.watcher = this.runner.watchOperation(job.operationId).pipe(finalize(() => {
      this.watching = false;
      if (this.runner.operation()?.status === 'Pending' && !this.importError) {
        this.progressMessage = 'Import is still pending. You can check progress again.';
      }
    })).subscribe({
      next: result => { if (!isPending(result)) this.handleResult(result); },
      error: error => this.operationError(error)
    });
    this.requests.add(this.watcher);
  }

  pauseProgress(): void { this.watcher?.unsubscribe(); }

  dismissOperation(): void {
    this.pauseProgress();
    this.runner.clearOperation();
    this.progressMessage = '';
    this.importError = '';
  }

  private handleResult(result: PlayerOnboardResult): void {
    if (isCompleted(result)) {
      this.runner.clearOperation();
      this.progressMessage = 'Import complete. Your tournament and player history have been refreshed.';
      this.loadMine();
      return;
    }
    this.runner.remember(result, this.bracketUrl);
    if (isPending(result)) {
      if (!this.runner.operation()) { this.importError = 'Import started without a progress reference. Refresh your paths before trying again.'; return; }
      this.resumeProgress();
    } else {
      this.progressMessage = '';
      this.importError = result.status === 'Expired' ? 'This import expired. Retry to continue processing its saved bracket.' :
        'This import did not finish. You can retry its saved bracket.';
    }
  }

  private operationError(error: unknown): void {
    this.progressMessage = '';
    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.runner.clearOperation();
      this.importError = 'This import is not available to your account. Refresh your paths before starting another import.';
    } else {
      this.importError = apiErrorMessage(error, 'Unable to check this import. Try again without submitting a new bracket.');
    }
  }
}
