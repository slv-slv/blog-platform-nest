import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { SortDirection } from '../../../common/types/paging-params.types.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { GetQuestionsQuery, GetQuestionsUseCase } from './get-questions.use-case.js';
import { PublishedStatus, QuestionsSortBy } from '../../types/question.types.js';

describe('GetQuestionsUseCase Integration', () => {
  let app: INestApplication;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let getQuestionsUseCase: GetQuestionsUseCase;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendConfirmationCode: () => {}, sendRecoveryCode: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    questionsRepository = app.get(QuestionsRepository);
    questionEntityRepository = app.get(getRepositoryToken(Question));
    getQuestionsUseCase = app.get(GetQuestionsUseCase);
  }, 30000);

  beforeEach(async () => {
    await questionEntityRepository.manager.query(`
      TRUNCATE
        typeorm.questions,
        typeorm.correct_answers
      RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return filtered and sorted published questions', async () => {
    await questionsRepository.createQuestion('Gamma other body', ['correct-1']);

    const betaQuestion = await questionsRepository.createQuestion('Beta search body', ['beta-correct']);
    const betaQuestionToPublish = await questionsRepository.getQuestion(betaQuestion.id.toString());
    await betaQuestionToPublish.setPublishedStatus(true);
    await questionsRepository.save(betaQuestionToPublish);

    const deltaQuestion = await questionsRepository.createQuestion('Delta search body', ['delta-correct']);
    const deltaQuestionToPublish = await questionsRepository.getQuestion(deltaQuestion.id.toString());
    await deltaQuestionToPublish.setPublishedStatus(true);
    await questionsRepository.save(deltaQuestionToPublish);

    await questionsRepository.createQuestion('Alpha search body', ['alpha-correct']);

    const result = await getQuestionsUseCase.execute(
      new GetQuestionsQuery({
        bodySearchTerm: 'search',
        publishedStatus: PublishedStatus.published,
        pagingParams: {
          sortBy: QuestionsSortBy.body,
          sortDirection: SortDirection.asc,
          pageNumber: 1,
          pageSize: 10,
        },
      }),
    );

    expect(result.pagesCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((item) => item.body)).toEqual(['Beta search body', 'Delta search body']);
    expect(result.items.map((item) => item.correctAnswers)).toEqual([['beta-correct'], ['delta-correct']]);
    expect(result.items.every((item) => item.published)).toBe(true);
    expect(result.items.every((item) => item.createdAt)).toBe(true);
  });

  it('should return the second page of questions after ascending sort by body', async () => {
    await questionsRepository.createQuestion('Question C', ['correct-c']);
    await questionsRepository.createQuestion('Question A', ['correct-a']);
    await questionsRepository.createQuestion('Question B', ['correct-b']);

    const firstPageResult = await getQuestionsUseCase.execute(
      new GetQuestionsQuery({
        bodySearchTerm: null,
        publishedStatus: PublishedStatus.all,
        pagingParams: {
          sortBy: QuestionsSortBy.body,
          sortDirection: SortDirection.asc,
          pageNumber: 1,
          pageSize: 2,
        },
      }),
    );

    const secondPageResult = await getQuestionsUseCase.execute(
      new GetQuestionsQuery({
        bodySearchTerm: null,
        publishedStatus: PublishedStatus.all,
        pagingParams: {
          sortBy: QuestionsSortBy.body,
          sortDirection: SortDirection.asc,
          pageNumber: 2,
          pageSize: 2,
        },
      }),
    );

    expect(firstPageResult.items).toMatchObject([
      { body: 'Question A', correctAnswers: ['correct-a'] },
      { body: 'Question B', correctAnswers: ['correct-b'] },
    ]);

    expect(secondPageResult.pagesCount).toBe(2);
    expect(secondPageResult.page).toBe(2);
    expect(secondPageResult.pageSize).toBe(2);
    expect(secondPageResult.totalCount).toBe(3);
    expect(secondPageResult.items).toHaveLength(1);
    expect(secondPageResult.items[0]).toMatchObject({
      body: 'Question C',
      correctAnswers: ['correct-c'],
    });
  });
});
