import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { GamesQueryRepository } from '../../infrastructure/typeorm/games.query-repository.js';
import { GameViewModel } from '../../types/game.types.js';
import { GetCurrentGameQuery, GetCurrentGameUseCase } from './get-current-game.use-case.js';

describe('GetCurrentGameUseCase', () => {
  let useCase: GetCurrentGameUseCase;
  let gamesQueryRepository: Pick<GamesQueryRepository, 'getCurrentGameViewModel'>;

  beforeEach(() => {
    gamesQueryRepository = {
      getCurrentGameViewModel: vi.fn(),
    };

    useCase = new GetCurrentGameUseCase(gamesQueryRepository as GamesQueryRepository);
  });

  it('should return current game view model from query repository', async () => {
    const currentGameViewModel: GameViewModel = {
      id: '1',
      firstPlayerProgress: {
        answers: [],
        player: {
          id: '10',
          login: 'first-player',
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: 'PendingSecondPlayer',
      pairCreatedDate: new Date().toISOString(),
      startGameDate: null,
      finishGameDate: null,
    };
    vi.mocked(gamesQueryRepository.getCurrentGameViewModel).mockResolvedValue(currentGameViewModel);

    const result = await useCase.execute(new GetCurrentGameQuery('10'));

    expect(gamesQueryRepository.getCurrentGameViewModel).toHaveBeenCalledTimes(1);
    expect(gamesQueryRepository.getCurrentGameViewModel).toHaveBeenCalledWith('10');
    expect(result).toEqual(currentGameViewModel);
  });

  it('should propagate repository error', async () => {
    const error = new GameNotFoundDomainException('Current game not found');
    vi.mocked(gamesQueryRepository.getCurrentGameViewModel).mockRejectedValue(error);

    await expect(useCase.execute(new GetCurrentGameQuery('10'))).rejects.toBe(error);
    expect(gamesQueryRepository.getCurrentGameViewModel).toHaveBeenCalledWith('10');
  });
});
