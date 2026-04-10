import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GetQuestionsParams, QuestionsPaginatedViewModel } from '../../types/question.types.js';
import { QuestionsQueryRepository } from '../../infrastructure/typeorm/questions.query-repository.js';

export class GetQuestionsQuery extends Query<QuestionsPaginatedViewModel> {
  constructor(public readonly params: GetQuestionsParams) {
    super();
  }
}

@QueryHandler(GetQuestionsQuery)
export class GetQuestionsUseCase implements IQueryHandler<GetQuestionsQuery> {
  constructor(private readonly questionsQueryRepository: QuestionsQueryRepository) {}

  async execute(query: GetQuestionsQuery) {
    return await this.questionsQueryRepository.getQuestions(query.params);
  }
}
