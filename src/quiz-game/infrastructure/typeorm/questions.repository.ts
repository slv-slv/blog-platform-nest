import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity.js';
import { Repository } from 'typeorm';
import { QuestionViewModel } from '../../types/question.types.js';

@Injectable()
export class QuestionsRepository {
  constructor(@InjectRepository(Question) private readonly questionsRepository: Repository<Question>) {}

  async createQuestion(body: string, correctAnswers: string[]): Promise<QuestionViewModel> {
    const question = this.questionsRepository.create({
      body,
      published: false,
      correctAnswers: correctAnswers.map((answer) => ({ answer })),
    });

    const savedQuestion = await this.questionsRepository.save(question);

    return {
      id: savedQuestion.id.toString(),
      body: savedQuestion.body,
      correctAnswers: savedQuestion.correctAnswers.map((correctAnswer) => correctAnswer.answer),
      published: savedQuestion.published,
      createdAt: savedQuestion.createdAt.toISOString(),
      updatedAt: savedQuestion.updatedAt.toISOString(),
    };
  }
}
