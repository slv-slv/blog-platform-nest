import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GameStatus,
  GameViewModel,
  GamesPaginatedViewModel,
  GamesSortBy,
  GetMyGamesParams,
  GetTopPlayersParams,
  mapGameStatusToViewModel,
  PlayerProgressViewModel,
  PlayerStatisticViewModel,
  TopPlayersPaginatedViewModel,
} from '../../types/game.types.js';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { UsersRepository } from '../../../user-accounts/infrastructure/typeorm/users.repository.js';
import { AnswerStatus, mapAnswerStatusToViewModel } from '../../types/player-answer.types.js';
import {
  AccessDeniedDomainException,
  GameNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../../common/helpers/is-positive-integer-string.js';
import { SortDirection } from '../../../../common/types/paging-params.types.js';

type RawMyStatisticViewModel = {
  [K in keyof PlayerStatisticViewModel]: number;
};

type RawMyGamesResult = {
  totalCount: number;
  items: GameViewModel[] | string;
};

type RawTopPlayersResult = {
  totalCount: number;
  playerId: number | null;
  login: string | null;
  sumScore: number | null;
  avgScores: number | null;
  gamesCount: number | null;
  winsCount: number | null;
  lossesCount: number | null;
  drawsCount: number | null;
};

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @InjectRepository(PlayerAnswer) private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getTopPlayers(params: GetTopPlayersParams): Promise<TopPlayersPaginatedViewModel> {
    const skipCount = (params.pageNumber - 1) * params.pageSize;
    const topPlayersOrderBy = [
      ...params.sort.map(([sortBy, sortDirection]) => {
        const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
        return `tps."${sortBy}" ${direction}`;
      }),
      'tps."playerId" ASC',
    ].join(', ');

    const rows = (await this.gameEntityRepository.query(
      `
      WITH "PlayerGames" AS (
        SELECT DISTINCT
          g.id AS "gameId",
          pa."userId" AS "playerId",
          CASE
            WHEN pa."userId" = g."firstPlayerId" THEN g."secondPlayerId"
            ELSE g."firstPlayerId"
          END AS "opponentId"
        FROM typeorm.player_answers AS pa
        JOIN typeorm.games AS g
          ON pa."gameId" = g.id
          AND (pa."userId" = g."firstPlayerId" OR pa."userId" = g."secondPlayerId")
        WHERE g.status = $1
      ),
      "PlayerScores" AS (
        SELECT
          pg."gameId",
          pg."playerId",
          SUM(pa.points) FILTER (WHERE pa."userId" = pg."playerId") AS "playerScore",
          SUM(pa.points) FILTER (WHERE pa."userId" = pg."opponentId") AS "opponentScore"
        FROM "PlayerGames" AS pg
        JOIN typeorm.player_answers AS pa
          ON pg."gameId" = pa."gameId"
        GROUP BY pg."gameId", pg."playerId", pg."opponentId"
      ),
      "TopPlayers" AS (
        SELECT
          ps."playerId",
          COALESCE(SUM(ps."playerScore"), 0)::int AS "sumScore",
          COALESCE(ROUND(AVG(ps."playerScore")::numeric, 2), 0)::float AS "avgScores",
          COUNT(ps."gameId")::int AS "gamesCount",
          COUNT(ps."gameId") FILTER (WHERE ps."playerScore" > ps."opponentScore")::int AS "winsCount",
          COUNT(ps."gameId") FILTER (WHERE ps."playerScore" < ps."opponentScore")::int AS "lossesCount",
          COUNT(ps."gameId") FILTER (WHERE ps."playerScore" = ps."opponentScore")::int AS "drawsCount"
        FROM "PlayerScores" AS ps
        GROUP BY ps."playerId"
      ),
      "TopPlayersTotalCount" AS (
        SELECT COUNT(*)::int AS "totalCount"
        FROM "TopPlayers"
      ),
      "TopPlayersPage" AS (
        SELECT
          tps.*,
          ROW_NUMBER() OVER (ORDER BY ${topPlayersOrderBy})::int AS "rowNumber"
        FROM "TopPlayers" AS tps
        ORDER BY "rowNumber" ASC
        LIMIT $2 OFFSET $3
      )
      SELECT
        tc."totalCount" AS "totalCount",
        tpp."playerId" AS "playerId",
        u.login AS login,
        tpp."sumScore" AS "sumScore",
        tpp."avgScores" AS "avgScores",
        tpp."gamesCount" AS "gamesCount",
        tpp."winsCount" AS "winsCount",
        tpp."lossesCount" AS "lossesCount",
        tpp."drawsCount" AS "drawsCount"
      FROM "TopPlayersTotalCount" AS tc
      LEFT JOIN "TopPlayersPage" AS tpp ON TRUE
      LEFT JOIN typeorm.users AS u ON u.id = tpp."playerId"
      ORDER BY tpp."rowNumber" ASC
      `,
      [GameStatus.finished, params.pageSize, skipCount],
    )) as RawTopPlayersResult[];

    const totalCount = rows[0]?.totalCount ?? 0;
    const pagesCount = Math.ceil(totalCount / params.pageSize);
    const items = rows
      .filter((row) => row.playerId !== null)
      .map((row) => ({
        sumScore: row.sumScore!,
        avgScores: row.avgScores!,
        gamesCount: row.gamesCount!,
        winsCount: row.winsCount!,
        lossesCount: row.lossesCount!,
        drawsCount: row.drawsCount!,
        player: {
          id: String(row.playerId),
          login: row.login!,
        },
      }));

    return {
      pagesCount,
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
      items,
    };
  }

  async getMyGames(userId: string, params: GetMyGamesParams): Promise<GamesPaginatedViewModel> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const { sortBy, sortDirection, pageNumber, pageSize } = params.pagingParams;
    const userIdInt = +userId;
    const skipCount = (pageNumber - 1) * pageSize;

    const sortColumns: Record<GamesSortBy, string> = {
      [GamesSortBy.status]: 'status',
      [GamesSortBy.pairCreatedDate]: '"pairCreatedDate"',
      [GamesSortBy.startGameDate]: '"startGameDate"',
      [GamesSortBy.finishGameDate]: '"finishGameDate"',
    };

    const orderBy = sortColumns[sortBy];
    const direction = sortDirection === SortDirection.asc ? 'ASC' : 'DESC';
    const pagePairCreatedDateFallback =
      sortBy === GamesSortBy.pairCreatedDate ? '' : ', g."pairCreatedDate" DESC';
    const resultPairCreatedDateFallback =
      sortBy === GamesSortBy.pairCreatedDate ? '' : ', gp."pairCreatedDate" DESC';

    const [result] = (await this.gameEntityRepository.query(
      `
      WITH filtered_games AS (
        SELECT g.*
        FROM typeorm.games AS g
        WHERE g."firstPlayerId" = $1 OR g."secondPlayerId" = $1
      ),
      total_count AS (
        SELECT COUNT(*)::int AS count
        FROM filtered_games
      ),
      games_page AS (
        SELECT g.*
        FROM filtered_games AS g
        ORDER BY g.${orderBy} ${direction}${pagePairCreatedDateFallback}, g.id DESC
        LIMIT $2 OFFSET $3
      ),
      answers_by_player AS (
        SELECT
          pa."gameId",
          pa."userId",
          jsonb_agg(
            jsonb_build_object(
              'questionId', pa."questionId"::text,
              'answerStatus',
                CASE
                  WHEN pa.status = $4 THEN 'Correct'
                  ELSE 'Incorrect'
                END,
              'addedAt', to_char(pa."addedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
            ORDER BY pa."addedAt", pa."questionId"
          ) AS answers,
          SUM(pa.points)::int AS score
        FROM typeorm.player_answers AS pa
        JOIN games_page AS gp ON gp.id = pa."gameId"
        GROUP BY pa."gameId", pa."userId"
      ),
      questions_by_game AS (
        SELECT
          gq."gameId",
          jsonb_agg(
            jsonb_build_object(
              'id', q.id::text,
              'body', q.body
            )
            ORDER BY gq."questionNumber"
          ) AS questions
        FROM typeorm.game_questions AS gq
        JOIN typeorm.questions AS q ON q.id = gq."questionId"
        JOIN games_page AS gp ON gp.id = gq."gameId"
        GROUP BY gq."gameId"
      ),
      items_json AS (
        SELECT
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', gp.id::text,
                'firstPlayerProgress', jsonb_build_object(
                  'answers', COALESCE(fpa.answers, '[]'::jsonb),
                  'player', jsonb_build_object(
                    'id', first_user.id::text,
                    'login', first_user.login
                  ),
                  'score', COALESCE(fpa.score, 0)
                ),
                'secondPlayerProgress',
                  CASE
                    WHEN gp."secondPlayerId" IS NULL THEN NULL
                    ELSE jsonb_build_object(
                      'answers', COALESCE(spa.answers, '[]'::jsonb),
                      'player', jsonb_build_object(
                        'id', second_user.id::text,
                        'login', second_user.login
                      ),
                      'score', COALESCE(spa.score, 0)
                    )
                  END,
                'questions',
                  CASE
                    WHEN gp.status = $5 THEN NULL
                    ELSE COALESCE(qg.questions, '[]'::jsonb)
                  END,
                'status',
                  CASE
                    WHEN gp.status = $5 THEN 'PendingSecondPlayer'
                    WHEN gp.status = $6 THEN 'Active'
                    ELSE 'Finished'
                  END,
                'pairCreatedDate', to_char(gp."pairCreatedDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                'startGameDate',
                  CASE
                    WHEN gp."startGameDate" IS NULL THEN NULL
                    ELSE to_char(gp."startGameDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                  END,
                'finishGameDate',
                  CASE
                    WHEN gp."finishGameDate" IS NULL THEN NULL
                    ELSE to_char(gp."finishGameDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                  END
              )
              ORDER BY gp.${orderBy} ${direction}${resultPairCreatedDateFallback}, gp.id DESC
            ) FILTER (WHERE gp.id IS NOT NULL),
            '[]'::jsonb
          ) AS items
        FROM games_page AS gp
        LEFT JOIN typeorm.users AS first_user ON first_user.id = gp."firstPlayerId"
        LEFT JOIN typeorm.users AS second_user ON second_user.id = gp."secondPlayerId"
        LEFT JOIN answers_by_player AS fpa
          ON fpa."gameId" = gp.id
          AND fpa."userId" = gp."firstPlayerId"
        LEFT JOIN answers_by_player AS spa
          ON spa."gameId" = gp.id
          AND spa."userId" = gp."secondPlayerId"
        LEFT JOIN questions_by_game AS qg ON qg."gameId" = gp.id
      )
      SELECT
        tc.count AS "totalCount",
        ij.items AS items
      FROM total_count AS tc
      CROSS JOIN items_json AS ij;
      `,
      [userIdInt, pageSize, skipCount, AnswerStatus.correct, GameStatus.pending, GameStatus.active],
    )) as RawMyGamesResult[];

    const totalCount = result?.totalCount ?? 0;
    const pagesCount = Math.ceil(totalCount / pageSize);
    const items =
      typeof result?.items === 'string'
        ? (JSON.parse(result.items) as GameViewModel[])
        : (result?.items ?? []);

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getMyStatistic(userId: string): Promise<PlayerStatisticViewModel> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const myGamesCte = this.gameEntityRepository
      .createQueryBuilder('g')
      .select('g.id', 'id')
      .addSelect(
        `CASE
          WHEN g."firstPlayerId" = :userId THEN g."firstPlayerId"
          ELSE g."secondPlayerId"
        END`,
        'my_id',
      )
      .addSelect(
        `CASE
          WHEN g."firstPlayerId" = :userId THEN g."secondPlayerId"
          ELSE g."firstPlayerId"
        END`,
        'opponent_id',
      )
      .where('g.status = :finishedStatus')
      .andWhere('(g."firstPlayerId" = :userId OR g."secondPlayerId" = :userId)');

    const myGamesScoresCte = this.gameEntityRepository.manager
      .createQueryBuilder()
      .select('mg.id', 'game_id')
      .addSelect('SUM(pa.points) FILTER (WHERE pa."userId" = mg.my_id)::int', 'my_score')
      .addSelect('SUM(pa.points) FILTER (WHERE pa."userId" = mg.opponent_id)::int', 'opponent_score')
      .from('my_games', 'mg')
      .innerJoin(PlayerAnswer, 'pa', 'mg.id = pa."gameId"')
      .groupBy('mg.id');

    const statistic = await this.gameEntityRepository.manager
      .createQueryBuilder()
      .addCommonTableExpression(myGamesCte, 'my_games')
      .addCommonTableExpression(myGamesScoresCte, 'my_games_scores')
      .select('COALESCE(SUM(mgs.my_score), 0)::int', 'sumScore')
      .addSelect('COALESCE(ROUND(AVG(mgs.my_score)::numeric, 2), 0)::float', 'avgScores')
      .addSelect('COUNT(mgs.game_id)::int', 'gamesCount')
      .addSelect('COUNT(*) FILTER (WHERE mgs.my_score > mgs.opponent_score)::int', 'winsCount')
      .addSelect('COUNT(*) FILTER (WHERE mgs.my_score < mgs.opponent_score)::int', 'lossesCount')
      .addSelect('COUNT(*) FILTER (WHERE mgs.my_score = mgs.opponent_score)::int', 'drawsCount')
      .from('my_games_scores', 'mgs')
      .setParameters({
        userId: +userId,
        finishedStatus: GameStatus.finished,
      })
      .getRawOne<RawMyStatisticViewModel>();

    return {
      sumScore: statistic?.sumScore ?? 0,
      avgScores: statistic?.avgScores ?? 0,
      gamesCount: statistic?.gamesCount ?? 0,
      winsCount: statistic?.winsCount ?? 0,
      lossesCount: statistic?.lossesCount ?? 0,
      drawsCount: statistic?.drawsCount ?? 0,
    };
  }

  async getCurrentGameViewModel(userId: string): Promise<GameViewModel> {
    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const game = await this.gameEntityRepository.findOne({
      where: [
        { firstPlayerId: +userId, status: In([GameStatus.pending, GameStatus.active]) },
        { secondPlayerId: +userId, status: GameStatus.active },
      ],
      select: { id: true },
    });

    if (!game) {
      throw new GameNotFoundDomainException('Current game not found');
    }

    return this.getGameViewModel(game.id);
  }

  async getGameViewModelForUser(gameId: string, userId: string): Promise<GameViewModel> {
    if (!isPositiveIntegerString(gameId)) {
      throw new GameNotFoundDomainException();
    }

    if (!isPositiveIntegerString(userId)) {
      throw new UnauthorizedDomainException();
    }

    const game = await this.gameEntityRepository.findOne({
      where: { id: +gameId },
      select: { id: true, firstPlayerId: true, secondPlayerId: true },
    });

    if (!game) {
      throw new GameNotFoundDomainException();
    }

    const currentUserId = +userId;
    const isParticipant = game.firstPlayerId === currentUserId || game.secondPlayerId === currentUserId;

    if (!isParticipant) {
      throw new AccessDeniedDomainException();
    }

    return this.getGameViewModel(game.id);
  }

  async getGameViewModel(gameId: number): Promise<GameViewModel> {
    const game = await this.gameEntityRepository.findOne({
      where: { id: gameId },
      relations: { questionEntries: { question: true } },
      order: {
        questionEntries: {
          questionNumber: 'ASC',
        },
      },
    });

    if (!game) {
      throw new GameNotFoundDomainException();
    }

    const firstPlayerProgress = await this.getPlayerProgress(game.id, game.firstPlayerId);
    const secondPlayerProgress =
      game.secondPlayerId === null ? null : await this.getPlayerProgress(game.id, game.secondPlayerId);

    const questions = game.questionEntries.map((entry) => ({
      id: entry.question.id.toString(),
      body: entry.question.body,
    }));

    const status = mapGameStatusToViewModel[game.status];

    const pairCreatedDate = game.pairCreatedDate.toISOString();

    const startGameDate = game.startGameDate?.toISOString() ?? null;

    const finishGameDate = game.finishGameDate?.toISOString() ?? null;

    return {
      id: gameId.toString(),
      firstPlayerProgress,
      secondPlayerProgress,
      questions: status === 'PendingSecondPlayer' ? null : questions,
      status,
      pairCreatedDate,
      startGameDate,
      finishGameDate,
    };
  }

  async getPlayerProgress(gameId: number, userId: number): Promise<PlayerProgressViewModel> {
    const rawAnswers = await this.playerAnswerEntityRepository.find({
      select: {
        questionId: true,
        status: true,
        points: true,
        addedAt: true,
      },
      where: { gameId, userId },
      order: { addedAt: 'ASC' },
    });

    const answers = rawAnswers.map((ans) => ({
      questionId: ans.questionId.toString(),
      answerStatus: mapAnswerStatusToViewModel[ans.status],
      addedAt: ans.addedAt.toISOString(),
    }));

    const login = await this.usersRepository.getLogin(userId.toString());
    const player = { id: userId.toString(), login };
    const score = rawAnswers.reduce((acc, ans) => acc + ans.points, 0);

    return { answers, player, score };
  }
}
