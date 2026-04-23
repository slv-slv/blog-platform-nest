import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { validateOrThrow } from './validate-or-throw.js';

class QuizConfig {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  declare questionsCount: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  declare bonusPoints: number;
}

export const quizConfig = registerAs('quiz', () => {
  const quizConfigEnvInput = {
    questionsCount: process.env.QUIZ_QUESTIONS_COUNT,
    bonusPoints: process.env.QUIZ_BONUS_POINTS,
  };

  const quizConfigEnv = plainToInstance(QuizConfig, quizConfigEnvInput);
  return validateOrThrow(quizConfigEnv, 'quiz config');
});
