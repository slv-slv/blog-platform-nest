import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import {
  BasicPagingParams,
  PagingParamsType,
  SortDirection,
} from '../../../common/types/paging-params.types.js';
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

export type PlayerStatisticViewModel = {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
};

export type PlayerStatisticWithLoginViewModel = PlayerStatisticViewModel & {
  player: {
    id: string;
    login: string;
  };
};

export type TopPlayersPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PlayerStatisticWithLoginViewModel[];
};

export enum PlayerStatisticSortBy {
  sumScore = 'sumScore',
  avgScores = 'avgScores',
  gamesCount = 'gamesCount',
  winsCount = 'winsCount',
  lossesCount = 'lossesCount',
  drawsCount = 'drawsCount',
}

export type PlayerStatisticSort = [PlayerStatisticSortBy, SortDirection];

export type GetTopPlayersParams = {
  sort: PlayerStatisticSort[];
  pageNumber: number;
  pageSize: number;
};

export class GetTopPlayersQueryDto {
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]).map((item) => item.split(' ')))
  @IsOptional()
  sort: PlayerStatisticSort[] = [
    [PlayerStatisticSortBy.avgScores, SortDirection.desc],
    [PlayerStatisticSortBy.sumScore, SortDirection.desc],
  ];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageNumber: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number = 10;
}
