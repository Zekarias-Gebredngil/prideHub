import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const createPrisma = () => ({
    message: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  });

  it('returns one inbox row per conversation counterpart', async () => {
    const prisma = createPrisma();
    prisma.message.findMany.mockResolvedValue([
      {
        id: 'latest-from-client-a',
        senderId: 'client-a',
        receiverId: 'current-user',
        content: 'Can we talk about the package?',
        createdAt: new Date('2026-06-20T09:00:00Z'),
        sender: { id: 'client-a', fullName: 'Client A', avatar: null },
      },
      {
        id: 'latest-to-client-b',
        senderId: 'current-user',
        receiverId: 'client-b',
        content: 'I sent the quote.',
        createdAt: new Date('2026-06-20T08:00:00Z'),
        sender: { id: 'current-user', fullName: 'Planner', avatar: null },
      },
      {
        id: 'older-from-client-a',
        senderId: 'client-a',
        receiverId: 'current-user',
        content: 'Hello',
        createdAt: new Date('2026-06-20T07:00:00Z'),
        sender: { id: 'client-a', fullName: 'Client A', avatar: null },
      },
    ]);
    prisma.user.findMany.mockResolvedValue([
      { id: 'client-a', fullName: 'Client A', avatar: null },
      { id: 'client-b', fullName: 'Client B', avatar: null },
    ]);
    const service = new MessagesService(prisma as any);

    const result = await service.getInbox('current-user');

    expect(result).toHaveLength(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['client-a', 'client-b'] } },
      select: { id: true, fullName: true, avatar: true },
    });
    expect(result.map((message: any) => message.counterpart.id)).toEqual(['client-a', 'client-b']);
    expect(result.map((message: any) => message.id)).toEqual(['latest-from-client-a', 'latest-to-client-b']);
  });
});
