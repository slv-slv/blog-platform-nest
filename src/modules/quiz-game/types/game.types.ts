import { IsEnum, IsOptional, Matches } from 'class-validator';
import { BasicPagingParams, PagingParamsType } from '../../../common/types/paging-params.types.js';
import { AnswerStatusViewModel } from './player-answer.types.js';

export class GetGameByIdParamDto {
  @Matches(/^[1-9]\d*$/, { message: 'Invalid id format' })
  declare id: string;
}

export enum GameStatus {
  pending = 'pending',
  active = 'active',
  finished = 'finished',
}

export type GameStatusViewModel = 'PendingSecondPlayer' | 'Active' | 'Finished';

export const mapGameStatusToViewModel: Record<GameStatus, GameStatusViewModel> = {
  [GameStatus.pending]: 'PendingSecondPlayer',
  [GameStatus.active]: 'Active',
  [GameStatus.finished]: 'Finished',
};

export enum GamesSortBy {
  status = 'status',
  pairCreatedDate = 'pairCreatedDate',
  startGameDate = 'startGameDate',
  finishGameDate = 'finishGameDate',
}

export class GetMyGamesQueryDto extends BasicPagingParams {
  @IsOptional()
  @IsEnum(GamesSortBy)
  sortBy: GamesSortBy = GamesSortBy.pairCreatedDate;
}

export type PlayerProgressViewModel = {
  answers: {
    questionId: string;
    answerStatus: AnswerStatusViewModel;
    addedAt: string;
  }[];
  player: {
    id: string;
    login: string;
  };
  score: number;
};

export type GameQuestionViewModel = {
  id: string;
  body: string;
};

export type GameViewModel = {
  id: string;
  firstPlayerProgress: PlayerProgressViewModel;
  secondPlayerProgress: PlayerProgressViewModel | null;
  questions: GameQuestionViewModel[] | null;
  status: GameStatusViewModel;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
};

export type GamesPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: GameViewModel[];
};

export type GetMyGamesParams = {
  pagingParams: PagingParamsType<GamesSortBy>;
};

export type MyStatisticViewModel = {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
};
