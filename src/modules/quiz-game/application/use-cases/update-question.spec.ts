import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../../app.module.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { UpdateQuestionUseCase, UpdateQuestionCommand } from './update-question.use-case.js';
import { QuestionNotFoundDomainException } from '../../../../common/exceptions/domain-exceptions.js';

describe('UpdateQuestionUseCase Integration', () => {
  let app: INestApplication;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let updateQuestionUseCase: UpdateQuestionUseCase;

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
    updateQuestionUseCase = app.get(UpdateQuestionUseCase);
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

  it('should update body and replace correct answers', async () => {
    const createdQuestion = await questionsRepository.createQuestion('Original question body', [
      'correct-1',
      'correct-2',
    ]);

    await new Promise((resolve) => setTimeout(resolve, 5));

    await updateQuestionUseCase.execute(
      new UpdateQuestionCommand({
        id: createdQuestion.id.toString(),
        body: 'Updated question body',
        correctAnswers: ['updated-1', 'updated-2', 'updated-3'],
      }),
    );

    const updatedQuestion = await questionEntityRepository.findOne({
      where: { id: createdQuestion.id },
      relations: { correctAnswers: true },
    });

    expect(updatedQuestion).not.toBeNull();
    expect(updatedQuestion!.body).toBe('Updated question body');
    expect(updatedQuestion!.correctAnswers.map((answer) => answer.answer)).toEqual([
      'updated-1',
      'updated-2',
      'updated-3',
    ]);
    expect(updatedQuestion!.updatedAt.getTime()).toBeGreaterThan(createdQuestion.updatedAt.getTime());
  });

  it('should throw QuestionNotFoundDomainException when question does not exist', async () => {
    await expect(
      updateQuestionUseCase.execute(
        new UpdateQuestionCommand({
          id: '999999',
          body: 'Updated question body',
          correctAnswers: ['updated-1'],
        }),
      ),
    ).rejects.toBeInstanceOf(QuestionNotFoundDomainException);
  });
});
