import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LeagueByOrgData, LeagueService, PlayerRegisterData } from '../../../services/league.service';
import { LeagueStateService } from '../../../services/LeagueStateService.service';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  selector: 'app-league-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './league-register.component.html',
  styleUrl: './league-register.component.css',
  standalone: true
})
export class LeagueRegisterComponent implements OnInit {
  @Output() back = new EventEmitter<void>();

  newPlayer: PlayerRegisterData = {
    PlayerId: 0, PlayerName: '', PlayerEmail: '',
    GameIds: [], LeagueId: 0
  };
  userLink: string = '';
  userEmail: string = '';
  league?: LeagueByOrgData;
  errorMessage = '';
  loading = false;
  regSuccess = '';
  syncSuccess = false;

  constructor(private route: ActivatedRoute,private router: Router, private leagueService: LeagueService, private leagueStateService: LeagueStateService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const leagueIdParam = params.get('leagueId');
      if (leagueIdParam) {
        const leagueIdNum = parseInt(leagueIdParam, 10);
        this.newPlayer.LeagueId = leagueIdNum;
        console.log('Current League ID:', this.newPlayer.LeagueId);
        const cached = this.leagueStateService.getCachedLeague(leagueIdNum);
        if (cached) {
          this.league = cached;
        } else {
          // this.leagueService.getLeagueById(leagueIdNum).subscribe(league => {
          //   this.league = league;
          // });
        }
      }
    });
  }

  goBack(): void {
    if (this.league) {
      this.router.navigate(['/leaderboards', this.league.leagueId]);
      console.log('Navigating back to league:', this.league.leagueId);
    } else {
      // fallback
      this.router.navigate(['/leaderboards']);
    }
  }
  sendNewPlayerRegistration() {
    this.leagueService.registerPlayerForLeague(this.leagueStateService.getPlayer())
      .subscribe({
        next: (response: string) => {
          console.log('Raw server response:', response);
          if (response != undefined && response != null && response != '') {
            // success
            this.regSuccess = response;
            this.errorMessage = '';
          } else {
            // server returned false
            throw new Error('Failed to register player: ' + response);
          }
        },
        error: (err) => {
          console.error('Error while Registering', err);
          this.errorMessage = 'Failed to register player. Please try again later.';
        }
      });
  }  
  syncStartggDataToRegisterPlayer(playerName: string, userLink: string): void {
      this.leagueService.syncStartggDataToRegisterPlayer(playerName, userLink).pipe(
        tap((res: any) => {
          console.log('Incoming Data:', res);
          const incoming = res.data;
    
          if (!incoming) {
            throw new Error('No "data" field in server response');
          }
    
          this.newPlayer.PlayerId = incoming.playerId;
          this.newPlayer.PlayerName = incoming.playerName;
          this.newPlayer.GameIds = incoming.gameIds ?? [];
    
          console.log('Synced Player:', this.newPlayer);
    
          if (this.newPlayer.PlayerId === 0) {
            throw new Error('Failed to sync data (ID is 0)');
          } else {
            this.errorMessage = '';
            this.syncSuccess = true;
            this.leagueStateService.setPlayer({ ...this.newPlayer });
          }
        }),
        catchError(error => {
          console.error('Error while syncing data', error);
          this.errorMessage = 'Failed to sync data. Please try again later.';
          return EMPTY;
        })
      ).subscribe();
    }
    
}
