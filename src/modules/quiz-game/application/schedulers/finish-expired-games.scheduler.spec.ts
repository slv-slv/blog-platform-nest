import { CommandBus } from '@nestjs/cqrs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FinishExpiredGamesScheduler } from './finish-expired-games.scheduler.js';

describe('FinishExpiredGamesScheduler', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  it('should execute finish expired games command outside testing environment', async () => {
    process.env.NODE_ENV = 'development';
    const execute = vi.fn().mockResolvedValue(undefined);
    const commandBus = {
      execute,
    } as unknown as CommandBus;
    const scheduler = new FinishExpiredGamesScheduler(commandBus);

    await scheduler.handle();

    expect(execute).toHaveBeenCalledOnce();
  });

  it('should skip execution in testing environment', async () => {
    process.env.NODE_ENV = 'testing';
    const execute = vi.fn().mockResolvedValue(undefined);
    const commandBus = {
      execute,
    } as unknown as CommandBus;
    const scheduler = new FinishExpiredGamesScheduler(commandBus);

    await scheduler.handle();

    expect(execute).not.toHaveBeenCalled();
  });
});
