import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../../common/guards/basic-auth.guard.js';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateQuestionInputDto,
  GetQuestionsQueryDto,
  PublishQuestionInputDto,
  QuestionsPaginatedViewModel,
  QuestionViewModel,
  UpdateQuestionInputDto,
} from '../types/question.types.js';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case.js';
import { UpdateQuestionCommand } from '../application/use-cases/update-question.use-case.js';
import { DeleteQuestionCommand } from '../application/use-cases/delete-question.use-case.js';
import { PublishQuestionCommand } from '../application/use-cases/publish-question.use-case.js';
import { GetQuestionsQuery } from '../application/use-cases/get-questions.use-case.js';

@Controller('sa/questions')
@UseGuards(BasicAuthGuard)
export class QuestionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getQuestions(@Query() query: GetQuestionsQueryDto): Promise<QuestionsPaginatedViewModel> {
    const { bodySearchTerm, publishedStatus, sortBy, sortDirection, pageNumber, pageSize } = query;
    const pagingParams = { sortBy, sortDirection, pageNumber, pageSize };
    return await this.queryBus.execute(
      new GetQuestionsQuery({ bodySearchTerm, publishedStatus, pagingParams }),
    );
  }

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

  @Delete(':id')
  @HttpCode(204)
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @Put(':id/publish')
  @HttpCode(204)
  async publishQuestion(@Param('id') id: string, @Body() body: PublishQuestionInputDto) {
    await this.commandBus.execute(new PublishQuestionCommand(id, body.published));
  }
}
