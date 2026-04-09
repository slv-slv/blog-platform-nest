import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { Repository } from 'typeorm';

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
}
