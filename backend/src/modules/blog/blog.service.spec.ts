import { NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  const createPrisma = () => ({
    blogPost: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    blogComment: {
      create: jest.fn(),
    },
  });

  it('creates an unapproved comment for an existing published post slug', async () => {
    const prisma = createPrisma();
    prisma.blogPost.findFirst.mockResolvedValue({ id: 'post-id' });
    prisma.blogComment.create.mockResolvedValue({
      id: 'comment-id',
      postId: 'post-id',
      authorName: 'Aster',
      authorEmail: 'aster@example.com',
      content: 'This was genuinely useful.',
      isApproved: false,
    });
    const service = new BlogService(prisma as any);

    const result = await service.createComment('planning-guide', {
      authorName: 'Aster',
      authorEmail: 'aster@example.com',
      content: 'This was genuinely useful.',
    });

    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith({
      where: { slug: 'planning-guide', deletedAt: null, status: 'PUBLISHED' },
      select: { id: true },
    });
    expect(prisma.blogComment.create).toHaveBeenCalledWith({
      data: {
        postId: 'post-id',
        authorName: 'Aster',
        authorEmail: 'aster@example.com',
        content: 'This was genuinely useful.',
        parentId: undefined,
      },
    });
    expect(result).toEqual(expect.objectContaining({ id: 'comment-id', isApproved: false }));
  });

  it('rejects comments for missing posts', async () => {
    const prisma = createPrisma();
    prisma.blogPost.findFirst.mockResolvedValue(null);
    const service = new BlogService(prisma as any);

    await expect(service.createComment('missing-post', {
      authorName: 'Aster',
      authorEmail: 'aster@example.com',
      content: 'This was genuinely useful.',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.blogComment.create).not.toHaveBeenCalled();
  });

  it('does not filter by published status when listing all admin posts', async () => {
    const prisma = createPrisma();
    const service = new BlogService(prisma as any);

    await service.findAll({ page: 1, limit: 10, skip: 0, take: 10 } as any, undefined, 'ALL');

    expect(prisma.blogPost.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null },
    }));
    expect(prisma.blogPost.count).toHaveBeenCalledWith({
      where: { deletedAt: null },
    });
  });
});
