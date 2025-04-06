import { Component, Input, Output, EventEmitter, SimpleChange, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';
import { LeagueByOrgData, LeaguePlayerRankingData, LeagueService, LeagueTournamentData, TotalPlayerRankingCard } from '../../../services/league.service';
import { FeedData, FeedsService } from '../../../services/feeds.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY, tap } from 'rxjs';
import { FeedsSubscribeOverlayComponent } from '../../feeds/feeds-subscribe-overlay/feeds-subscribe-overlay.component';

@Component({
  selector: 'app-league-details',
  imports: [CommonModule, FormsModule, FeedsSubscribeOverlayComponent],
  templateUrl: './league-details.component.html',
  styleUrl: './league-details.component.css',
  standalone: true,
})
export class LeagueDetailsComponent implements OnChanges {
  @Input() league!: LeagueByOrgData;
  @Output() back = new EventEmitter<void>();
  leagueEvents: LeagueTournamentData[] = [];
  playerRankings: LeaguePlayerRankingData[] = [];
  totalRankingCards: TotalPlayerRankingCard[] = [];
  selectedFeed: FeedData | null = null;
  errorMessage: string = '';
  loading: boolean = false;

  goBack(): void {
    this.back.emit();
  }

  constructor(private leagueService: LeagueService, private feedsService: FeedsService, private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['league'] && changes['league'].currentValue) {
      console.log(this.league.leagueId);
      this.getLeagueSchedule(this.league.leagueId);
      this.getPlayerRankings([this.league.leagueId]);
    }
  }
  openSubscribeOverlay(feedId: number): void {
    this.getCurrentLeagueFeed(feedId.toString());
  }
  clearSelection(): void {
    this.selectedFeed = null;
  }
  getCurrentLeagueFeed(feedId: string): void {
    this.errorMessage = '';
    this.loading = true;

    this.feedsService.getFeedByFeedId(feedId)
      .pipe(
        tap((data: FeedData) => {
          this.selectedFeed = data;
          this.loading = false;
          if (!data) {
            this.errorMessage = 'No Feeds found for the given Feed Id';
          } else {
            this.errorMessage = '';
          }
        }),
        catchError(error => {
          console.error('Failed to load Feeds', error);
          this.errorMessage = 'Failed to load Feeds';
          this.loading = false;
          return EMPTY;
        })
      ).subscribe();
  }

  getPlayerRankings(leagueIds: number[]) {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryPlayerRankings(leagueIds, 2)
      .pipe(
        tap((data: LeaguePlayerRankingData[]) => {
          this.playerRankings = data;
          this.totalRankingCards = this.calculatePlayerScore(data);
          this.loading = false;
          if (data.length === 0) {
            this.errorMessage = 'No Player Rankings found for the given League Id';
          } else {
            this.errorMessage = '';
          }
        }),
        catchError(error => {
          console.error('Failed to load Player Rankings', error);
          this.errorMessage = 'Failed to load Player Rankings';
          this.loading = false;
          return EMPTY;
        })
      ).subscribe();
  }
  calculatePlayerScore(data: LeaguePlayerRankingData[]): TotalPlayerRankingCard[] {
    const playerMap = new Map<number, LeaguePlayerRankingData[]>();

    // Group entries by playerId
    for (const entry of data) {
      if (!playerMap.has(entry.playerId)) {
        playerMap.set(entry.playerId, []);
      }
      playerMap.get(entry.playerId)!.push(entry);
    }

    // Calculate total score and other metrics for each player
    const result: TotalPlayerRankingCard[] = [];

    for (const [playerId, entries] of playerMap) {
      const first = entries[0];

      const totalScore = entries.reduce((sum, item) => sum + item.gainedPoints, 0);
      const totalTournaments = entries.length;
      const mostRecentUpdate = entries.reduce((latest, item) =>
        !item.lastUpdated ? latest :
        !latest || new Date(item.lastUpdated) > new Date(latest) ? item.lastUpdated : latest,
        null as Date | null
      );

      result.push({
        playerName: first.playerName,
        currentScore: totalScore,
        scoreDifference: first.scoreDifference,
        tournamentCount: totalTournaments,
        lastUpdated: mostRecentUpdate,
        gameId: first.gameId
      });
    }

    // Sort players by highest currentScore
    return result.sort((a, b) => b.currentScore - a.currentScore);
  }
  getLeagueSchedule(leagueId: number): void {
    this.errorMessage = '';
    this.loading = true;

    this.leagueService.queryTournamentsByLeague([leagueId])
      .pipe(
        tap((data: LeagueTournamentData[]) => {
          this.leagueEvents = data;
          this.loading = false;
          if (data.length === 0) {
            this.errorMessage = 'No Events found for the given League Id';
          } else {
            this.errorMessage = '';
          }
          this.cdr.detectChanges();
        }),
        catchError(error => {
          console.error('Failed to load League Events', error);
          this.errorMessage = 'Failed to load League Events';
          this.loading = false;
          return EMPTY;
        })
      ).subscribe();
  }
}
