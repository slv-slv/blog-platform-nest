import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { GameViewModel, mapGameStatusToViewModel, PlayerProgressViewModel } from '../../types/game.types.js';
import { PlayerAnswer } from './entities/player-answer.entity.js';
import { UsersRepository } from '../../../modules/user-accounts/infrastructure/typeorm/users.repository.js';
import { AnswerStatus, mapAnswerStatusToViewModel } from '../../types/player-answer.types.js';
import { GameNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';

@Injectable()
export class GamesQueryRepository {
  constructor(
    @InjectRepository(Game) private readonly gameEntityRepository: Repository<Game>,
    @InjectRepository(PlayerAnswer) private readonly playerAnswerEntityRepository: Repository<PlayerAnswer>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getGameViewModel(id: number): Promise<GameViewModel> {
    const game = await this.gameEntityRepository.findOne({
      where: { id },
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
      id: id.toString(),
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
    const rawAnswers = await this.playerAnswerEntityRepository.findBy({ gameId, userId });
    const answers = rawAnswers.map((ans) => ({
      questionId: ans.questionId.toString(),
      answerStatus: mapAnswerStatusToViewModel[ans.status],
      addedAt: ans.addedAt.toISOString(),
    }));

    const login = await this.usersRepository.getLogin(userId.toString());
    const player = { id: userId.toString(), login };

    const score = rawAnswers.filter((ans) => ans.status === AnswerStatus.correct).length;

    return { answers, player, score };
  }
}
