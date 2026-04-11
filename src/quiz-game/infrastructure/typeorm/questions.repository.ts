import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { Repository } from 'typeorm';
import { QuestionNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';
import { CorrectAnswer } from './entities/correct-answer.entity.js';
import { UpdateQuestionParams } from '../../types/question.types.js';

@Injectable()
export class QuestionsRepository {
  constructor(@InjectRepository(Question) private readonly questionEntityRepository: Repository<Question>) {}

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

    const question = await this.questionEntityRepository.findOne({
      where: { id: +id },
      relations: { correctAnswers: true },
    });

    if (!question) {
      throw new QuestionNotFoundDomainException();
    }

    question.body = body;
    question.correctAnswers = correctAnswers.map((answer) => {
      const correctAnswer = new CorrectAnswer();
      correctAnswer.answer = answer;
      return correctAnswer;
    });

    await this.questionEntityRepository.save(question);
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
