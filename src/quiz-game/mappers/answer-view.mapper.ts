import { PlayerAnswer } from '../infrastructure/typeorm/entities/player-answer.entity.js';
import { AnswerStatus, PlayerAnswerViewModel } from '../types/player-answer.types.js';

export const mapAnswerToViewModel = (playerAnswer: PlayerAnswer): PlayerAnswerViewModel => {
  return {
    questionId: playerAnswer.questionId.toString(),
    answerStatus: playerAnswer.status === AnswerStatus.correct ? 'Correct' : 'Incorrect',
    addedAt: playerAnswer.addedAt.toISOString(),
  };
};
