import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { BlogsPaginatedType } from '../../types/blogs.types.js';
import { PagingParamsType } from '../../../../../common/types/paging-params.types.js';
import { InjectModel } from '@nestjs/mongoose';
import { Blog } from './blogs.schemas.js';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private readonly model: Model<Blog>) {}

  async getAllBlogs(
    searchNameTerm: string | null,
    pagingParams: PagingParamsType,
  ): Promise<BlogsPaginatedType> {
    const { sortBy, sortDirection, pageNumber, pageSize } = pagingParams;

    const filter = searchNameTerm ? { name: { $regex: searchNameTerm, $options: 'i' } } : {};

    const totalCount = await this.model.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);

    const blogsWithObjectId = await this.model
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'asc' ? 1 : -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const blogs = blogsWithObjectId.map((blog) => {
      return {
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      };
    });

    return {
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: blogs,
    };
  }
}
