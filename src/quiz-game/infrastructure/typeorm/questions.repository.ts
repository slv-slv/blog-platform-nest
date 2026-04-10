import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { Repository } from 'typeorm';
import { QuestionNotFoundDomainException } from '../../../common/exceptions/domain-exceptions.js';
import { isPositiveIntegerString } from '../../../common/helpers/is-positive-integer-string.js';

@Injectable()
export class QuestionsRepository {
  constructor(@InjectRepository(Question) private readonly questionsRepository: Repository<Question>) {}

  async createQuestion(body: string, correctAnswers: string[]): Promise<Question> {
    const question = this.questionsRepository.create({
      body,
      published: false,
      correctAnswers: correctAnswers.map((answer) => ({ answer })),
    });

    return await this.questionsRepository.save(question);
  }

  async updateQuestion(id: string, body: string, correctAnswers: string[]): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const result = await this.questionsRepository.update(
      { id: +id },
      { body, correctAnswers: correctAnswers.map((answer) => ({ answer })) },
    );

    if (result.affected === 0) {
      throw new QuestionNotFoundDomainException();
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const result = await this.questionsRepository.softDelete({ id: +id });

    if (result.affected === 0) {
      throw new QuestionNotFoundDomainException();
    }
  }

  async publishQuestion(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const result = await this.questionsRepository.update({ id: +id }, { published: true });
    if (result.affected === 0) {
      throw new QuestionNotFoundDomainException();
    }
  }

  async unpublishQuestion(id: string): Promise<void> {
    if (!isPositiveIntegerString(id)) {
      throw new QuestionNotFoundDomainException();
    }

    const result = await this.questionsRepository.update({ id: +id }, { published: false });
    if (result.affected === 0) {
      throw new QuestionNotFoundDomainException();
    }
  }
}
