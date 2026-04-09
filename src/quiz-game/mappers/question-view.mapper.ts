import { Question } from '../infrastructure/typeorm/entities/question.entity.js';
import { QuestionViewModel } from '../types/question.types.js';

export const mapQuestionToViewModel = (question: Question): QuestionViewModel => {
  return {
    id: question.id.toString(),
    body: question.body,
    correctAnswers: question.correctAnswers.map((correctAnswer) => correctAnswer.answer),
    published: question.published,
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
};
