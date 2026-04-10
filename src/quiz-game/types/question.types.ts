import { IsArray, IsString, Length } from 'class-validator';
import { PagingParamsType } from '../../common/types/paging-params.types.js';
import { Trim } from '../../common/decorators/trim.js';

export class CreateQuestionInputDto {
  @IsString()
  @Trim()
  @Length(10, 500)
  declare body: string;

  @IsArray()
  @IsString({ each: true })
  declare correctAnswers: string[];
}

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

export enum QuestionsSortBy {
  body = 'body',
  published = 'published',
  createdAt = 'createdAt',
}

export enum PublishedStatus {
  all = 'all',
  published = 'published',
  notPublished = 'notPublished',
}

export type GetQuestionsParams = {
  bodySearchTerm: string | null;
  publishedStatus: PublishedStatus;
  pagingParams: PagingParamsType<QuestionsSortBy>;
};

export type QuestionsPaginatedViewModel = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: QuestionViewModel[];
};
