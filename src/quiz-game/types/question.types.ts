import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { BasicPagingParams, PagingParamsType } from '../../common/types/paging-params.types.js';
import { Trim } from '../../common/decorators/trim.js';

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

export class GetQuestionsQueryDto extends BasicPagingParams {
  @IsOptional()
  @IsString()
  @Trim()
  bodySearchTerm: string | null = null;

  @IsOptional()
  @IsEnum(PublishedStatus)
  publishedStatus: PublishedStatus = PublishedStatus.all;

  @IsOptional()
  @IsEnum(QuestionsSortBy)
  sortBy: QuestionsSortBy = QuestionsSortBy.createdAt;
}

export class CreateQuestionInputDto {
  @IsString()
  @Trim()
  @Length(10, 500)
  declare body: string;

  @IsArray()
  @IsString({ each: true })
  declare correctAnswers: string[];
}

export class UpdateQuestionInputDto extends CreateQuestionInputDto {}

export class PublishQuestionInputDto {
  @IsBoolean()
  declare published: boolean;
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
