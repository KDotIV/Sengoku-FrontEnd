import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BracketVictoryPathData, EntrantSetCard } from '../../services/bracket-runner.models';

interface CandidateGroup { step: number | null; cards: EntrantSetCard[]; }
@Component({
  selector: 'app-path-list',
  imports: [DatePipe],
  templateUrl: './path-list.component.html',
  styleUrl: './bracket-runner.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class PathListComponent {
  readonly paths = input<BracketVictoryPathData[]>([]);
  readonly showPlayer = input(false);

  groups(path: BracketVictoryPathData): CandidateGroup[] {
    const groups = new Map<number, EntrantSetCard[]>();
    const legacy: EntrantSetCard[] = [];
    for (const card of path.entrantSetCards) {
      if (card.pathStep == null) legacy.push(card);
      else groups.set(card.pathStep, [...(groups.get(card.pathStep) ?? []), card]);
    }
    const result: CandidateGroup[] = [...groups].sort(([a], [b]) => a - b).map(([step, cards]) => ({ step, cards }));
    if (legacy.length) result.push({ step: null, cards: legacy });
    return result;
  }

  opponent(path: BracketVictoryPathData, card: EntrantSetCard): string {
    return card.playerOneID === path.playerTournamentCard.playerID ? card.entrantTwoName :
      card.playerTwoID === path.playerTournamentCard.playerID ? card.entrantOneName :
      `${card.entrantOneName} / ${card.entrantTwoName}`;
  }
}
