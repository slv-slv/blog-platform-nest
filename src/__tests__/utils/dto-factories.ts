import type { CreateBlogInputDto } from '../../modules/blog-content/types/blogs.types.js';
import type { CreateCommentInputDto } from '../../modules/blog-content/types/comments.types.js';
import type {
  CreatePostForBlogInputDto,
  CreatePostInputDto,
} from '../../modules/blog-content/types/posts.types.js';
import type { PlayerAnswerInputDto } from '../../modules/quiz-game/types/player-answer.types.js';
import type { CreateQuestionInputDto } from '../../modules/quiz-game/types/question.types.js';
import type { CreateUserInputDto, LoginInputDto } from '../../modules/user-accounts/types/users.types.js';

export function makeUserDto(overrides: Partial<CreateUserInputDto> = {}): CreateUserInputDto {
  return {
    login: 'NewUser',
    email: 'example@gmail.com',
    password: 'somepassword',
    ...overrides,
  };
}

export function makeLoginDto(overrides: Partial<LoginInputDto> = {}): LoginInputDto {
  return {
    loginOrEmail: 'NewUser',
    password: 'somepassword',
    ...overrides,
  };
}

export function makeBlogDto(overrides: Partial<CreateBlogInputDto> = {}): CreateBlogInputDto {
  return {
    name: 'BlogName',
    description: 'Blog description',
    websiteUrl: 'https://www.example.com',
    ...overrides,
  };
}

export function makePostDto(overrides: Partial<CreatePostInputDto> = {}): CreatePostInputDto {
  return {
    title: 'Post title',
    shortDescription: 'Post short description',
    content: 'Long enough post content',
    ...overrides,
  };
}

export function makePostForBlogDto(
  overrides: Partial<CreatePostForBlogInputDto> = {},
): CreatePostForBlogInputDto {
  return {
    ...makePostDto(),
    blogId: '1',
    ...overrides,
  };
}

export function makeCommentDto(overrides: Partial<CreateCommentInputDto> = {}): CreateCommentInputDto {
  return {
    content: 'This comment has enough length',
    ...overrides,
  };
}

export function makeQuestionDto(overrides: Partial<CreateQuestionInputDto> = {}): CreateQuestionInputDto {
  return {
    body: 'Question body to use in tests',
    correctAnswers: ['correct-answer'],
    ...overrides,
  };
}

export function makePlayerAnswerDto(overrides: Partial<PlayerAnswerInputDto> = {}): PlayerAnswerInputDto {
  return {
    answer: 'correct-answer',
    ...overrides,
  };
}
