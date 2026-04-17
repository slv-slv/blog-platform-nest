import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import {
  GameStatus,
  GameViewModel,
  mapGameStatusToViewModel,
  PlayerProgressViewModel,
} from '../../types/game.types.js';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';
import { AnswerStatus, mapAnswerStatusToViewModel } from '../../types/player-answer.types.js';
import {
  AccessDeniedDomainException,
  GameNotFoundDomainException,
  UnauthorizedDomainException,
} from '../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @InjectRepository(PlayerAnswer) private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
    private readonly usersRepository: UsersRepository,
  ) {}

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
