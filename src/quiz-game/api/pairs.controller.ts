import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserId } from '../../common/decorators/userId.js';
import { AccessTokenGuard } from '../../common/guards/access-token.guard.js';
import { ConnectUserCommand } from '../application/use-cases/connect-user.use-case.js';
import { GetCurrentGameQuery } from '../application/use-cases/get-current-game.use-case.js';
import { GetGameByIdQuery } from '../application/use-cases/get-game-by-id.use-case.js';
import { GameViewModel, GetGameByIdParamDto } from '../types/game.types.js';
import { SubmitAnswerCommand } from '../application/use-cases/submit-answer.use-case.js';
import { PlayerAnswerInputDto, PlayerAnswerViewModel } from '../types/player-answer.types.js';

@Controller('pair-game-quiz/pairs')
@UseGuards(AccessTokenGuard)
export class PairsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('my-current')
  async getCurrentGame(@UserId() userId: string): Promise<GameViewModel> {
    return this.queryBus.execute(new GetCurrentGameQuery(userId));
  }

  @Get(':id')
  async getGameById(@Param() params: GetGameByIdParamDto, @UserId() userId: string): Promise<GameViewModel> {
    const { id } = params;
    return this.queryBus.execute(new GetGameByIdQuery(id, userId));
  }

  @Post('connection')
  @HttpCode(200)
  async connectUser(@UserId() userId: string): Promise<GameViewModel> {
    return this.commandBus.execute(new ConnectUserCommand(userId));
  }

  @Post('my-current/answers')
  @HttpCode(200)
  async submitAnswer(
    @UserId() userId: string,
    @Body() body: PlayerAnswerInputDto,
  ): Promise<PlayerAnswerViewModel> {
    return this.commandBus.execute(new SubmitAnswerCommand(userId, body.answer));
  }
}
