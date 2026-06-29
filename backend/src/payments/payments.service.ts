import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDER, PaymentProvider } from './payment.provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  /** Start checkout. In dev (mock) this completes immediately and enrolls. */
  async checkout(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.status !== 'PUBLISHED') {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return { status: 'paid', enrolled: true, alreadyEnrolled: true };
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        courseId,
        amountCents: course.priceCents,
        currency: course.currency,
        provider: 'STRIPE',
        status: 'PENDING',
      },
    });

    const result = await this.payments.checkout({
      orderId: order.id,
      amountCents: course.priceCents,
      currency: course.currency,
      courseTitle: course.title,
    });

    if (result.status === 'paid') {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        }),
        this.prisma.enrollment.create({
          data: { userId, courseId, status: 'ACTIVE', progressPercent: 0 },
        }),
      ]);
      return { status: 'paid', enrolled: true };
    }

    // Real Stripe path: client is redirected to result.url; the webhook confirms.
    return { status: 'pending', url: result.url, orderId: order.id };
  }

  /** Webhook entry. Dev: process JSON directly; prod: verify signature first. */
  async handleWebhook(body: { orderId?: string }) {
    // TODO(stripe): when STRIPE_WEBHOOK_SECRET is set, verify the signature
    // against the raw request body before trusting the event.
    const orderId = body.orderId;
    if (!orderId) return { received: true };

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === 'PAID') return { received: true };

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      }),
      this.prisma.enrollment.upsert({
        where: {
          userId_courseId: { userId: order.userId, courseId: order.courseId },
        },
        update: {},
        create: {
          userId: order.userId,
          courseId: order.courseId,
          status: 'ACTIVE',
        },
      }),
    ]);
    return { received: true };
  }
}
