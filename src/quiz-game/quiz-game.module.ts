import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateQuestionUseCase } from './application/use-cases/create-question.use-case.js';
import { QuestionsRepository } from './infrastructure/typeorm/questions.repository.js';
import { Question } from './infrastructure/typeorm/entities/question.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  providers: [QuestionsRepository, CreateQuestionUseCase],
})
export class QuizGameModule {}
