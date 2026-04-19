import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserId } from '../../../common/decorators/userId.js';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard.js';
import { ConnectUserCommand } from '../application/use-cases/connect-user.use-case.js';
import { GetCurrentGameQuery } from '../application/use-cases/get-current-game.use-case.js';
import { GetGameByIdQuery } from '../application/use-cases/get-game-by-id.use-case.js';
import { GetMyStatisticQuery } from '../application/use-cases/get-my-statistic.use-case.js';
import { GameViewModel, GetGameByIdParamDto, MyStatisticViewModel } from '../types/game.types.js';
import { SubmitAnswerCommand } from '../application/use-cases/submit-answer.use-case.js';
import { PlayerAnswerInputDto, PlayerAnswerViewModel } from '../types/player-answer.types.js';

@Controller('pair-game-quiz')
@UseGuards(AccessTokenGuard)
export class PairsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('users/my-statistic')
  async getMyStatistic(@UserId() userId: string): Promise<MyStatisticViewModel> {
    return this.queryBus.execute(new GetMyStatisticQuery(userId));
  }

  @Get('pairs/my-current')
  async getCurrentGame(@UserId() userId: string): Promise<GameViewModel> {
    return this.queryBus.execute(new GetCurrentGameQuery(userId));
  }

  @Get('pairs/:id')
  async getGameById(@Param() params: GetGameByIdParamDto, @UserId() userId: string): Promise<GameViewModel> {
    const { id } = params;
    return this.queryBus.execute(new GetGameByIdQuery(id, userId));
  }

  @Post('pairs/connection')
  @HttpCode(200)
  async connectUser(@UserId() userId: string): Promise<GameViewModel> {
    return this.commandBus.execute(new ConnectUserCommand(userId));
  }

  @Post('pairs/my-current/answers')
  @HttpCode(200)
  async submitAnswer(
    @UserId() userId: string,
    @Body() body: PlayerAnswerInputDto,
  ): Promise<PlayerAnswerViewModel> {
    return this.commandBus.execute(new SubmitAnswerCommand(userId, body.answer));
  }
}
