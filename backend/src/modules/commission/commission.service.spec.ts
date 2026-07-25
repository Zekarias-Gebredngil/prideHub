import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionType, EscrowStatus } from '@prisma/client';

describe('CommissionService', () => {
  let service: CommissionService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      commissionSettings: {
        findFirst: jest.fn().mockResolvedValue({
          globalDefaultRate: 0.10,
          platformFeeRate: 0.03,
          escrowHoldDays: 7,
        }),
        create: jest.fn(),
        update: jest.fn(),
      },
      commissionRule: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vendorProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      booking: {
        findUnique: jest.fn(),
      },
      commissionTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'comm-tx-1', ...args.data })),
        updateMany: jest.fn(),
      },
      financialLedger: {
        create: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      },
      platformRevenue: {
        create: jest.fn().mockResolvedValue({ id: 'rev-1' }),
      },
      escrowAccount: {
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'escrow-1', ...args.data })),
        update: jest.fn(),
      },
      escrowTransaction: {
        create: jest.fn(),
      },
      vendorWallet: {
        upsert: jest.fn().mockResolvedValue({ id: 'wallet-1', availableBalance: 900, lifetimeEarnings: 900 }),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      walletTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
  });

  describe('calculateCommission', () => {
    it('calculates global default commission (10%) with 0 client fee and profit earner payout', async () => {
      const result = await service.calculateCommission(1000);

      expect(result.grossAmount).toBe(1000);
      expect(result.commissionRate).toBe(0.10);
      expect(result.commissionAmount).toBe(100);
      expect(result.platformFeeRate).toBe(0);
      expect(result.platformFeeAmount).toBe(0);
      expect(result.vendorNetPayout).toBe(900);
      expect(result.appliedRuleName).toBe('Global Default');
    });

    it('enforces rule priority order with AND condition filter', async () => {
      prismaMock.commissionRule.findMany.mockResolvedValue([
        {
          id: 'vendor-rule-1',
          name: 'Vendor Specific Rate 5%',
          type: CommissionType.PERCENTAGE,
          rate: 0.05,
          priority: 10,
        },
      ]);

      const result = await service.calculateCommission(1000, 'vendor-123');

      expect(prismaMock.commissionRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([{ vendorId: 'vendor-123' }]),
              }),
            ]),
          }),
        }),
      );
      expect(result.commissionRate).toBe(0.05);
      expect(result.commissionAmount).toBe(50);
      expect(result.vendorNetPayout).toBe(950);
      expect(result.appliedRuleName).toBe('Vendor Specific Rate 5%');
    });
  });

  describe('processCommissionForPayment', () => {
    it('creates commission transaction and escrow held ledger entry for profit earner', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        items: [{ vendorId: 'vendor-1', vendor: { categoryId: 'cat-1' } }],
      });

      const res = await service.processCommissionForPayment('pay-1', 'booking-1', 2000, 'vendor-1');

      expect(prismaMock.commissionTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId: 'booking-1',
            paymentId: 'pay-1',
            grossAmount: 2000,
            commissionAmount: 200,
            vendorNetPayout: 1800,
          }),
        }),
      );
      expect(prismaMock.financialLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accountType: 'VENDOR',
            accountId: 'vendor-1',
            balance: 1800,
          }),
        }),
      );
    });
  });

  describe('releaseEscrow', () => {
    it('releases held escrow and credits vendor wallet', async () => {
      prismaMock.escrowAccount.findUnique.mockResolvedValue({
        id: 'escrow-1',
        bookingId: 'booking-1',
        vendorId: 'vendor-1',
        status: EscrowStatus.HELD,
        vendorNetAmount: 1800,
      });

      await service.releaseEscrow('booking-1');

      expect(prismaMock.escrowAccount.update).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
        data: expect.objectContaining({ status: EscrowStatus.RELEASED }),
      });
      expect(prismaMock.vendorWallet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vendorId: 'vendor-1' },
        }),
      );
    });
  });
});
