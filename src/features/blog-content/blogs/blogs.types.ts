import { IsUrl, MaxLength } from 'class-validator';
import { WithId } from 'mongodb';

export class CreateBlogInputDto {
  @MaxLength(15)
  name: string;

  @MaxLength(500)
  description: string;

  @IsUrl()
  websiteUrl: string;
}

export class UpdateBlogInputDto extends CreateBlogInputDto {}

export type BlogType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogDbType = WithId<{
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}>;

export enum BlogSortedByKeys {
  name = 'name',
  description = 'description',
  websiteUrl = 'websiteUrl',
  createdAt = 'createdAt',
  isMembership = 'isMembership',
}

export type BlogsPaginatedType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: BlogType[];
};
