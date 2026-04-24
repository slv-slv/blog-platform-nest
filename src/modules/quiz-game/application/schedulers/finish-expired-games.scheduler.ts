import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FinishExpiredGamesCommand } from '../use-cases/finish-expired-games.use-case.js';

@Injectable()
export class FinishExpiredGamesScheduler {
  constructor(private readonly commandBus: CommandBus) {}

  @Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true, disabled: true })
  async handle(): Promise<void> {
    if (process.env.NODE_ENV === 'testing') {
      return;
    }

    await this.commandBus.execute(new FinishExpiredGamesCommand());
  }
}
