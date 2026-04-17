import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { QuestionNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { PublishQuestionCommand, PublishQuestionUseCase } from './publish-question.use-case.js';

describe('PublishQuestionUseCase Integration', () => {
  let app: INestApplication;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let publishQuestionUseCase: PublishQuestionUseCase;

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
    publishQuestionUseCase = app.get(PublishQuestionUseCase);
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

  it('should update published status of question', async () => {
    const createdQuestion = await questionsRepository.createQuestion('Question body to publish', [
      'correct-1',
    ]);

    await publishQuestionUseCase.execute(new PublishQuestionCommand(createdQuestion.id.toString(), true));

    const publishedQuestion = await questionEntityRepository.findOne({
      where: { id: createdQuestion.id },
      relations: { correctAnswers: true },
    });

    expect(publishedQuestion).not.toBeNull();
    expect(publishedQuestion!).toMatchObject({
      body: 'Question body to publish',
      published: true,
    });
    expect(publishedQuestion!.correctAnswers.map((answer) => answer.answer)).toEqual(['correct-1']);
  });

  it('should throw QuestionNotFoundDomainException when question does not exist', async () => {
    await expect(
      publishQuestionUseCase.execute(new PublishQuestionCommand('999999', true)),
    ).rejects.toBeInstanceOf(QuestionNotFoundDomainException);
  });
});
