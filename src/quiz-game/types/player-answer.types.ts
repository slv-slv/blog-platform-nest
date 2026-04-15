import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../common/decorators/trim.js';

export class PlayerAnswerInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  declare answer: string;
}

export enum AnswerStatus {
  correct = 'correct',
  incorrect = 'incorrect',
}

export type AnswerStatusViewModel = Capitalize<`${AnswerStatus}`>;

export const mapAnswerStatusToViewModel: Record<AnswerStatus, AnswerStatusViewModel> = {
  [AnswerStatus.correct]: 'Correct',
  [AnswerStatus.incorrect]: 'Incorrect',
};

export type PlayerAnswerViewModel = {
  questionId: string;
  answerStatus: AnswerStatusViewModel;
  addedAt: string;
};
