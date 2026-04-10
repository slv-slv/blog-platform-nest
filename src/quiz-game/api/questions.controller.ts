import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateQuestionInputDto,
  QuestionViewModel,
  UpdateQuestionInputDto,
} from '../types/question.types.js';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case.js';
import { UpdateQuestionCommand } from '../application/use-cases/update-question.use-case.js';
import { DeleteQuestionCommand } from '../application/use-cases/delete-question.use-case.js';

@Controller('sa/questions')
@UseGuards(BasicAuthGuard)
export class QuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  // @HttpCode(201)
  async createQuestion(@Body() body: CreateQuestionInputDto): Promise<QuestionViewModel> {
    return await this.commandBus.execute(new CreateQuestionCommand(body.body, body.correctAnswers));
  }

  @Put(':id')
  @HttpCode(204)
  async updateQuestion(@Param('id') id: string, @Body() body: UpdateQuestionInputDto) {
    await this.commandBus.execute(
      new UpdateQuestionCommand({ id, body: body.body, correctAnswers: body.correctAnswers }),
    );
  }
}
