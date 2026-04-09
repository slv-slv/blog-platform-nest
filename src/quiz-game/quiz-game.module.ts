import { Module } from '@nestjs/common';
import { QuestionsRepository } from './infrastructure/typeorm/questions.repository.js';

@Module({
  providers: [QuestionsRepository],
})
export class QuizGameModule {}
