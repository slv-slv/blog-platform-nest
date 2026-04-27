import { IsNotEmpty, IsString } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.js';
import { EntityManager } from 'typeorm';

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

export type PlayerAnswerStats = {
  answersCount: number;
  correctAnswersCount: number;
  lastAnswerAt: Date | null;
};

export type BonusCandidate = {
  userId: string;
  stats: PlayerAnswerStats;
};

export type SubmitAnswerRepoParams = {
  gameId: string;
  userId: string;
  questionId: string;
  answer: string;
  status: AnswerStatus;
  points: number;
  manager: EntityManager;
};
