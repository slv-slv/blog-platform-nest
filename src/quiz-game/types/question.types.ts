export type QuestionViewModel = {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateQuestionParams = {
  id: string;
  body: string;
  correctAnswers: string[];
};
