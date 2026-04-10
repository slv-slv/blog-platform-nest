import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateQuestionUseCase } from './application/use-cases/create-question.use-case.js';
import { UpdateQuestionUseCase } from './application/use-cases/update-question.use-case.js';
import { DeleteQuestionUseCase } from './application/use-cases/delete-question.use-case.js';
import { QuestionsRepository } from './infrastructure/typeorm/questions.repository.js';
import { Question } from './infrastructure/typeorm/entities/question.entity.js';
import { CorrectAnswer } from './infrastructure/typeorm/entities/correct-answer.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Question, CorrectAnswer])],
  providers: [QuestionsRepository, CreateQuestionUseCase, UpdateQuestionUseCase, DeleteQuestionUseCase],
})
export class QuizGameModule {}
