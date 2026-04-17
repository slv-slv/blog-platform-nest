import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import {
  GetQuestionsParams,
  PublishedStatus,
  QuestionsPaginatedViewModel,
} from '../../types/question.types.js';
import { mapQuestionToViewModel } from '../../mappers/question-view.mapper.js';

@Injectable()
export class QuestionsQueryRepository {
  constructor(@InjectRepository(Question) private readonly questionEntityRepository: Repository<Question>) {}

  async getQuestions(params: GetQuestionsParams): Promise<QuestionsPaginatedViewModel> {
    const { bodySearchTerm, publishedStatus, pagingParams } = params;
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const where: FindOptionsWhere<Question> = {};

    if (bodySearchTerm) {
      where.body = ILike(`%${bodySearchTerm}%`);
    }

    const publishedMap: Record<PublishedStatus, boolean | null> = {
      [PublishedStatus.published]: true,
      [PublishedStatus.notPublished]: false,
      [PublishedStatus.all]: null,
    };

    const published = publishedMap[publishedStatus];

    if (published !== null) {
      where.published = published;
    }

    const [questions, totalCount] = await this.questionEntityRepository.findAndCount({
      where,
      relations: { correctAnswers: true },
      order: { [sortBy]: sortDirection },
      take: pageSize,
      skip: (pageNumber - 1) * pageSize,
    });

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: questions.map((question) => mapQuestionToViewModel(question)),
    };
  }
}
