import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const createPrisma = () => ({
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  });

  it('filters payment history to the current user for non-admin roles', async () => {
    const prisma = createPrisma();
    const service = new PaymentsService(prisma as any);

    await service.findAll({ page: 1, limit: 10, skip: 0, take: 10 } as any, { userId: 'client-id', isAdmin: false });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { booking: { clientId: 'client-id' } },
    }));
    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: { booking: { clientId: 'client-id' } },
    });
  });

  it('does not filter payment history for admins', async () => {
    const prisma = createPrisma();
    const service = new PaymentsService(prisma as any);

    await service.findAll({ page: 1, limit: 10, skip: 0, take: 10 } as any, { userId: 'admin-id', isAdmin: true });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(expect.not.objectContaining({ where: expect.anything() }));
    expect(prisma.payment.count).toHaveBeenCalledWith();
  });
});
