import { ForbiddenException, Injectable } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { PostDto } from './dto/post.dto';
import { CreatePostDto } from './dto/createPost.dto';
import { PostListQueryDto } from './dto/postList.dto';
import { PayloadDto } from 'src/auth/dto/payload.dto';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  async getPostList(query: PostListQueryDto) {
    const posts = (await this.postRepository.getPostList(query)).map((post) => {
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        type: post.type,
        tags: post.tags,
        author: {
          id: post.authorId,
          name: post.author.name,
        },
        participants: post.participants,
        maxParticipants: post.maxParticipants,
        createdAt: post.createdAt,
        deadline: post.deadline,
        ...(post.roommateDetails && { roommateDetails: post.roommateDetails }),
      };
    });
    const total = await this.postRepository.getCount(query.type);
    return { posts: posts, total: total };
  }

  async getPost(id: string): Promise<PostDto> {
    const post = await this.postRepository.getPost(id);
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      type: post.type,
      tags: post.tags,
      author: {
        id: post.authorId,
        name: post.author.name,
      },
      participants: post.participants,
      maxParticipants: post.maxParticipants,
      createdAt: post.createdAt,
      deadline: post.deadline,
      ...(post.roommateDetails && { roommateDetails: post.roommateDetails }),
    };
  }

  async createPost(postDto: CreatePostDto, user: PayloadDto): Promise<PostDto> {
    const post = await this.postRepository.createPost(postDto, user.id);

    return this.getPost(post.id);
  }

  async updatePost(
    id: string,
    postDto: CreatePostDto,
    user: PayloadDto,
  ): Promise<PostDto> {
    const authorId = (await this.postRepository.getPost(id)).authorId;
    if (authorId !== user.id) throw new ForbiddenException('Not match user id');

    await this.postRepository.updatePost(id, postDto);
    return this.getPost(id);
  }

  async joinPost(id: string, user: PayloadDto): Promise<PostDto> {
    await this.postRepository.joinPost(id, user.id);
    return this.getPost(id);
  }

  async deleteUser(
    postId: string,
    userId: string,
    user: PayloadDto,
  ): Promise<PostDto> {
    const post = await this.getPost(postId);
    if (user.id !== post.author.id && user.id !== userId)
      throw new ForbiddenException('Forbidden Access');
    await this.postRepository.deleteUser(postId, userId);
    return await this.getPost(postId);
  }

  async deletePost(id: string, user: PayloadDto) {
    const authorId = (await this.postRepository.getPost(id)).authorId;
    if (authorId !== user.id) throw new ForbiddenException('Not match user id');

    return await this.postRepository.deletePost(id);
  }
}
