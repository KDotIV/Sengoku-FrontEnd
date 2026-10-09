import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { BracketVictoryPathData, EntrantSetCard, PlayerOnboardResult, isCompleted, isPending } from '../../services/bracket-runner.models';
import { PlayerBracketService } from '../../services/player-bracket.service';
import { apiErrorMessage } from '../../shared/api-error';
import { normalizeBracketUrl } from '../../shared/startgg-url';

@Component({
  selector: 'app-bracket-runner',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './bracket-runner.component.html',
  styleUrls: ['./bracket-runner.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class BracketRunnerComponent implements OnInit {
  readonly runner = inject(PlayerBracketService);
  private readonly destroyRef = inject(DestroyRef);
  private watcher?: Subscription;
  private pathsRequest?: Subscription;
  playerIdInput: number | null = this.runner.selection?.playerId ?? null;
  bracketUrl = this.runner.selection?.bracketUrl ?? '';
  paths: BracketVictoryPathData[] = [];
  selectedPath: BracketVictoryPathData | null = null;
  loading = false;
  importing = false;
  watching = false;
  loaded = false;
  loadError = '';
  importError = '';
  progressMessage = '';
  completed = false;

  get playerId(): number | null { return this.runner.selection?.playerId ?? null; }
  get pendingOperation(): string | null { return this.runner.selection?.operationId ?? null; }

  ngOnInit(): void {
    if (this.playerId) this.loadPaths();
    if (this.pendingOperation) this.resumeProgress();
  }

  selectPlayer(): void {
    if (this.loading || this.importing || this.watching) return;
    this.loadError = '';
    try { this.runner.select(this.playerIdInput ?? 0); }
    catch (error) { this.loadError = apiErrorMessage(error, 'Enter a valid Sengoku player ID.'); return; }
    this.paths = [];
    this.selectedPath = null;
    this.loaded = false;
    this.importError = '';
    this.progressMessage = '';
    this.completed = false;
    this.bracketUrl = this.runner.selection?.bracketUrl ?? '';
    this.loadPaths();
  }

  loadPaths(force = false): void {
    if (!this.playerId || (this.loading && !force)) return;
    if (force) this.pathsRequest?.unsubscribe();
    this.loading = true;
    this.loadError = '';
    this.pathsRequest = this.runner.getPaths(this.playerId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading = false))
      .subscribe({
        next: paths => {
          this.paths = paths;
          this.selectedPath = null;
          this.loaded = true;
        },
        error: error => {
          this.paths = [];
          this.selectedPath = null;
          this.loaded = false;
          this.loadError = apiErrorMessage(error, 'Unable to load tournament paths. Please try again.');
        }
      });
  }

  importBracket(): void {
    if (!this.playerId || this.importing || this.watching || this.pendingOperation) return;
    this.importError = '';
    this.completed = false;
    this.progressMessage = '';
    let url: string;
    try { url = normalizeBracketUrl(this.bracketUrl); }
    catch (error) { this.importError = apiErrorMessage(error, 'Check the bracket link.'); return; }
    this.importing = true;
    this.runner.onboard(url, this.playerId)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.importing = false))
      .subscribe({
        next: result => {
          if (isPending(result)) {
            if (!result.operationId) {
              this.importError = 'Import started without a progress reference. Refresh tournament paths before trying again.';
              return;
            }
            try { this.runner.rememberOperation(result.operationId, url); }
            catch (error) { this.importError = apiErrorMessage(error, 'Unable to track import progress.'); return; }
            this.resumeProgress();
          } else {
            this.handleResult(result);
          }
        },
        error: error => this.importError = apiErrorMessage(error, 'Unable to import this bracket. Check that the player and tournament are already onboarded in Sengoku.')
      });
  }

  resumeProgress(): void {
    if (!this.pendingOperation || this.watching) return;
    this.importError = '';
    this.watching = true;
    this.progressMessage = 'Preparing player, Legend, and opponent data. This may take several minutes.';
    this.watcher = this.runner.watchOperation(this.pendingOperation)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
        this.watching = false;
        if (this.pendingOperation && !this.importError) {
          this.progressMessage = 'Import is still running. Check progress again when you are ready.';
        }
      }))
      .subscribe({
        next: result => { if (!isPending(result)) this.handleResult(result); },
        error: error => {
          this.progressMessage = '';
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.runner.rememberOperation(null, this.bracketUrl);
            this.importError = 'This import record is no longer available. Refresh tournament paths before importing again.';
          } else {
            this.importError = apiErrorMessage(error, 'Unable to check import progress. You can resume checking without importing again.');
          }
        }
      });
  }

  pauseProgress(): void {
    this.watcher?.unsubscribe();
  }

  private handleResult(result: PlayerOnboardResult): void {
    this.runner.rememberOperation(null, this.bracketUrl);
    if (isCompleted(result)) {
      this.completed = true;
      this.progressMessage = result.successful?.length
        ? 'Import complete. Refreshing your tournament paths.'
        : 'Import complete. There may be no opponents available in this bracket yet.';
      this.loadPaths(true);
    } else {
      this.progressMessage = '';
      this.importError = result.status === 'Expired'
        ? 'This import expired before opponent data was ready. Contact support before retrying.'
        : 'Bracket import did not complete. Check the bracket link and player, then try again.';
    }
  }

  togglePath(path: BracketVictoryPathData): void {
    this.selectedPath = this.selectedPath === path ? null : path;
  }

  opponentName(path: BracketVictoryPathData, card: EntrantSetCard): string {
    return card.playerOneID === path.playerTournamentCard.playerID
      ? card.entrantTwoName : card.playerTwoID === path.playerTournamentCard.playerID
      ? card.entrantOneName : `${card.entrantOneName} / ${card.entrantTwoName}`;
  }
}
