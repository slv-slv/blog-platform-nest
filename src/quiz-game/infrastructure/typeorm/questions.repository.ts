import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { DataSource, Repository } from 'typeorm';
import { QuestionNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import { CorrectAnswer } from './entities/correct-answer.entity.js';
import { UpdateQuestionParams } from '../../types/question.types.js';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Question) private readonly questionEntityRepository: Repository<Question>,
  ) {}

  async save(question: Question): Promise<Question> {
    return await this.questionEntityRepository.save(question);
  }

  async getQuestion(id: string): Promise<Question> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const question = await this.questionEntityRepository.findOneBy({ id: +id });
    if (!question) {
      throw new QuestionNotFoundDomainException();
    }

    return question;
  }

  async createQuestion(body: string, correctAnswers: string[]): Promise<Question> {
    const question = this.questionEntityRepository.create({
      body,
      published: false,
      correctAnswers: correctAnswers.map((answer) => ({ answer })),
    });

    return await this.questionEntityRepository.save(question);
  }

  async updateQuestion({ id, body, correctAnswers }: UpdateQuestionParams): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    await this.dataSource.transaction(async (manager) => {
      const questionEntityRepository = manager.getRepository(Question);
      const answerEntityRepository = manager.getRepository(CorrectAnswer);

      const result = await questionEntityRepository.update({ id: +id }, { body });
      if (result.affected === 0) {
        throw new QuestionNotFoundDomainException();
      }

      await answerEntityRepository.delete({ question: { id: +id } });
      await answerEntityRepository.insert(
        correctAnswers.map((answer) => ({ question: { id: +id }, answer })),
      );
    });
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const result = await this.questionEntityRepository.softDelete({ id: +id });

    if (result.affected === 0) {
      throw new QuestionNotFoundDomainException();
    }
  }
}
