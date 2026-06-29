import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService
  ) {}

  // ── Seed default subscription plans ──────────────────────────────────────

  async onModuleInit() {
    const plans = [
      {
        tier: SubscriptionTier.FREE,
        name: 'Free',
        description: 'Get started with basic features',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        yearlyPrice: 0,
        commissionRate: 0.10,
        maxListings: 5,
        priorityRanking: 0,
        isFeatured: false,
        hasAnalytics: false,
        hasEarlyPayout: false,
        hasDedicatedManager: false,
        hasApiAccess: false,
        trialDays: 0,
        sortOrder: 0,
      },
      {
        tier: SubscriptionTier.SILVER,
        name: 'Silver',
        description: 'For growing vendors',
        monthlyPrice: 299,
        quarterlyPrice: 799,
        yearlyPrice: 2999,
        commissionRate: 0.08,
        maxListings: 20,
        priorityRanking: 1,
        isFeatured: false,
        hasAnalytics: true,
        hasEarlyPayout: false,
        hasDedicatedManager: false,
        hasApiAccess: false,
        trialDays: 7,
        sortOrder: 1,
      },
      {
        tier: SubscriptionTier.GOLD,
        name: 'Gold',
        description: 'For established vendors',
        monthlyPrice: 599,
        quarterlyPrice: 1599,
        yearlyPrice: 5999,
        commissionRate: 0.06,
        maxListings: 50,
        priorityRanking: 2,
        isFeatured: true,
        hasAnalytics: true,
        hasEarlyPayout: true,
        hasDedicatedManager: false,
        hasApiAccess: false,
        trialDays: 14,
        sortOrder: 2,
      },
      {
        tier: SubscriptionTier.PLATINUM,
        name: 'Platinum',
        description: 'For premium vendors',
        monthlyPrice: 999,
        quarterlyPrice: 2699,
        yearlyPrice: 9999,
        commissionRate: 0.05,
        maxListings: 200,
        priorityRanking: 3,
        isFeatured: true,
        hasAnalytics: true,
        hasEarlyPayout: true,
        hasDedicatedManager: true,
        hasApiAccess: true,
        trialDays: 14,
        sortOrder: 3,
      },
      {
        tier: SubscriptionTier.ENTERPRISE,
        name: 'Enterprise',
        description: 'For large enterprises and agencies',
        monthlyPrice: 2999,
        quarterlyPrice: 7999,
        yearlyPrice: 29999,
        commissionRate: 0.03,
        maxListings: null,
        priorityRanking: 4,
        isFeatured: true,
        hasAnalytics: true,
        hasEarlyPayout: true,
        hasDedicatedManager: true,
        hasApiAccess: true,
        trialDays: 30,
        sortOrder: 4,
      },
    ];

    for (const plan of plans) {
      await this.prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        create: plan,
        update: {},
      });
    }
    this.logger.log('Subscription plans initialized');
  }

  // ── Plans ──────────────────────────────────────────────────────────────────

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  async updatePlan(id: string, data: Partial<{
    monthlyPrice: number;
    commissionRate: number;
    features: any;
    isActive: boolean;
  }>) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  // ── Vendor Subscriptions ──────────────────────────────────────────────────

  async subscribe(userId: string, planId: string, billingCycle = 'MONTHLY') {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const existing = await this.prisma.vendorSubscription.findUnique({ where: { vendorId: userId } });
    if (existing?.status === SubscriptionStatus.ACTIVE) {
      throw new ConflictException('Active subscription exists. Upgrade or cancel first.');
    }

    const now = new Date();
    let periodEnd: Date;
    let amount: number;

    switch (billingCycle) {
      case 'QUARTERLY':
        periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 3);
        amount = Number(plan.quarterlyPrice);
        break;
      case 'YEARLY':
        periodEnd = new Date(now);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        amount = Number(plan.yearlyPrice);
        break;
      default: // MONTHLY
        periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        amount = Number(plan.monthlyPrice);
    }

    const trialEndsAt = plan.trialDays > 0
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : undefined;

    const subscription = await this.prisma.vendorSubscription.upsert({
      where: { vendorId: userId },
      create: {
        vendorId: userId,
        planId,
        status: trialEndsAt ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        billingCycle,
        startDate: now,
        endDate: periodEnd,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      },
      update: {
        planId,
        status: trialEndsAt ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        billingCycle,
        startDate: now,
        endDate: periodEnd,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        renewedAt: now,
      },
    });

    // Record subscription payment
    if (amount > 0) {
      await this.prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount,
          billingPeriod: `${now.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
          status: 'PENDING',
        },
      });
    }

    // Record platform revenue
    if (amount > 0) {
      await this.prisma.platformRevenue.create({
        data: {
          category: 'SUBSCRIPTION',
          sourceId: subscription.id,
          sourceType: 'subscription',
          amount,
          description: `Subscription: ${plan.name} (${billingCycle})`,
        },
      });
    }

    return subscription;
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId: userId } });
    if (!sub) throw new NotFoundException('No subscription found');
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    return this.prisma.vendorSubscription.update({
      where: { vendorId: userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        autoRenew: false,
      },
    });
  }

  async getVendorSubscription(userId: string) {
    return this.prisma.vendorSubscription.findUnique({
      where: { vendorId: userId },
      include: { plan: true },
    });
  }

  async getSubscriptionHistory(userId: string) {
    const sub = await this.prisma.vendorSubscription.findUnique({ where: { vendorId: userId } });
    if (!sub) return [];
    return this.prisma.subscriptionPayment.findMany({
      where: { subscriptionId: sub.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Admin: get all subscriptions ──────────────────────────────────────────

  async getAllSubscriptions(status?: SubscriptionStatus, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vendorSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { name: true, tier: true } },
          vendor: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.vendorSubscription.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getSubscriptionStats() {
    const [active, trial, cancelled, totalMrr] = await Promise.all([
      this.prisma.vendorSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.vendorSubscription.count({ where: { status: SubscriptionStatus.TRIAL } }),
      this.prisma.vendorSubscription.count({ where: { status: SubscriptionStatus.CANCELLED } }),
      this.prisma.platformRevenue.aggregate({
        _sum: { amount: true },
        where: { category: 'SUBSCRIPTION' },
      }),
    ]);
    return {
      active,
      trial,
      cancelled,
      totalSubscriptionRevenue: totalMrr._sum.amount || 0,
    };
  }

  // ── Wallet Payment & Auto-Renewal ─────────────────────────────────────────

  async paySubscriptionWithWallet(vendorId: string, paymentId: string) {
    const payment = await this.prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, subscription: { vendorId }, status: 'PENDING' }
    });
    if (!payment) throw new NotFoundException('Pending subscription payment not found');

    const subscription = await this.prisma.vendorSubscription.findUnique({
      where: { id: payment.subscriptionId },
      include: { plan: true }
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    // Debit the wallet (will throw BadRequestException if insufficient balance)
    await this.commissionService.debitVendorWallet(
      vendorId, 
      Number(payment.amount), 
      payment.id, 
      'subscription', 
      `Subscription payment: ${subscription.plan.name}`
    );

    // Mark as paid
    const updatedPayment = await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      }
    });

    return updatedPayment;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoRenewSubscriptions() {
    this.logger.log('Running daily subscription auto-renewal check...');
    const now = new Date();
    
    // Find subscriptions ending today or yesterday that are active and set to auto-renew
    const dueSubscriptions = await this.prisma.vendorSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        currentPeriodEnd: { lte: now }
      },
      include: { plan: true }
    });

    for (const sub of dueSubscriptions) {
      try {
        let amount = 0;
        let nextEnd = new Date(sub.currentPeriodEnd || new Date());
        
        switch (sub.billingCycle) {
          case 'QUARTERLY':
            nextEnd.setMonth(nextEnd.getMonth() + 3);
            amount = Number(sub.plan.quarterlyPrice);
            break;
          case 'YEARLY':
            nextEnd.setFullYear(nextEnd.getFullYear() + 1);
            amount = Number(sub.plan.yearlyPrice);
            break;
          default:
            nextEnd.setMonth(nextEnd.getMonth() + 1);
            amount = Number(sub.plan.monthlyPrice);
        }

        // Create pending payment
        const payment = await this.prisma.subscriptionPayment.create({
          data: {
            subscriptionId: sub.id,
            amount,
            billingPeriod: `${(sub.currentPeriodEnd || new Date()).toISOString().split('T')[0]} to ${nextEnd.toISOString().split('T')[0]}`,
            status: 'PENDING',
          },
        });

        // Attempt wallet deduction immediately
        try {
          await this.paySubscriptionWithWallet(sub.vendorId, payment.id);
          
          // Extend subscription
          await this.prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: {
              currentPeriodStart: sub.currentPeriodEnd || new Date(),
              currentPeriodEnd: nextEnd,
              renewedAt: now
            }
          });
          this.logger.log(`Auto-renewed subscription for vendor ${sub.vendorId}`);
        } catch (walletError) {
          this.logger.warn(`Failed to auto-renew for vendor ${sub.vendorId} from wallet: ${walletError.message}`);
          // Keep it as PENDING and they can pay manually or we suspend them later
        }

      } catch (err) {
        this.logger.error(`Error processing auto-renewal for subscription ${sub.id}: ${err.message}`);
      }
    }
  }
}
