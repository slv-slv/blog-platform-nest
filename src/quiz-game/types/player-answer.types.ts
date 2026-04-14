import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/decorators/trim.js';

export class PlayerAnswerInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  declare answer: string;
}

export type PlayerAnswerViewModel = {
  questionId: string;
  answerStatus: 'Correct' | 'Incorrect';
  addedAt: string;
};
