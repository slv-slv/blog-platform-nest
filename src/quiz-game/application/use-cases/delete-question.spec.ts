import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { QuestionNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { QuestionsRepository } from '../../infrastructure/typeorm/questions.repository.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { DeleteQuestionCommand, DeleteQuestionUseCase } from './delete-question.use-case.js';

describe('DeleteQuestionUseCase Integration', () => {
  let app: INestApplication;
  let questionsRepository: QuestionsRepository;
  let questionEntityRepository: Repository<Question>;
  let deleteQuestionUseCase: DeleteQuestionUseCase;

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
    deleteQuestionUseCase = app.get(DeleteQuestionUseCase);
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

  it('should soft delete question', async () => {
    const createdQuestion = await questionsRepository.createQuestion('Question body to delete', [
      'correct-1',
      'correct-2',
    ]);

    await deleteQuestionUseCase.execute(new DeleteQuestionCommand(createdQuestion.id.toString()));

    const existingQuestion = await questionEntityRepository.findOne({
      where: { id: createdQuestion.id },
      relations: { correctAnswers: true },
    });

    const deletedQuestion = await questionEntityRepository.findOne({
      where: { id: createdQuestion.id },
      withDeleted: true,
      relations: { correctAnswers: true },
    });

    expect(existingQuestion).toBeNull();
    expect(deletedQuestion).not.toBeNull();
    expect(deletedQuestion!.deletedAt).not.toBeNull();
  });

  it('should throw QuestionNotFoundDomainException when question does not exist', async () => {
    await expect(deleteQuestionUseCase.execute(new DeleteQuestionCommand('999999'))).rejects.toBeInstanceOf(
      QuestionNotFoundDomainException,
    );
  });
});
