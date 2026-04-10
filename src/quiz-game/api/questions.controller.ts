import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateQuestionInputDto, QuestionViewModel } from '../types/question.types.js';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case.js';

@Controller('sa/questions')
@UseGuards(BasicAuthGuard)
export class QuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(201)
  async createQuestion(@Body() body: CreateQuestionInputDto): Promise<QuestionViewModel> {
    return await this.commandBus.execute(new CreateQuestionCommand(body.body, body.correctAnswers));
  }
}
