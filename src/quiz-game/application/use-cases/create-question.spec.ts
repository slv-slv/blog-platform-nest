import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { EmailService } from '../../../notifications/email/email.service.js';
import { Question } from '../../infrastructure/typeorm/entities/question.entity.js';
import { CreateQuestionCommand, CreateQuestionUseCase } from './create-question.use-case.js';

describe('CreateQuestionUseCase Integration', () => {
  let app: INestApplication;
  let questionEntityRepository: Repository<Question>;
  let createQuestionUseCase: CreateQuestionUseCase;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({ sendConfirmationCode: () => {}, sendRecoveryCode: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    questionEntityRepository = app.get(getRepositoryToken(Question));
    createQuestionUseCase = app.get(CreateQuestionUseCase);
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

  it('should create question and return view model', async () => {
    const result = await createQuestionUseCase.execute(
      new CreateQuestionCommand('What is the capital of France?', ['Paris', 'paris']),
    );

    const createdQuestion = await questionEntityRepository.findOne({
      where: { id: +result.id },
      relations: { correctAnswers: true },
    });

    expect(createdQuestion).not.toBeNull();
    expect(createdQuestion!.body).toBe('What is the capital of France?');
    expect(createdQuestion!.published).toBe(false);
    expect(createdQuestion!.correctAnswers.map((answer) => answer.answer)).toEqual(['Paris', 'paris']);

    expect(result).toEqual({
      id: expect.any(String),
      body: 'What is the capital of France?',
      correctAnswers: ['Paris', 'paris'],
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });
    expect(result.id).toBe(createdQuestion!.id.toString());
    expect(result.createdAt).toBe(createdQuestion!.createdAt.toISOString());
  });
});
