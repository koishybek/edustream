import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  MockPaymentProvider,
  PAYMENT_PROVIDER,
  StripePaymentProvider,
} from './payment.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      // Use the real Stripe provider only when a genuine test/live key is set;
      // the seeded placeholder (sk_test_xxx) falls back to the dev mock so
      // checkout enrolls instantly without external calls.
      useFactory: () => {
        const key = process.env.STRIPE_SECRET_KEY;
        const real = !!key && key.startsWith('sk_') && key !== 'sk_test_xxx';
        return real ? new StripePaymentProvider() : new MockPaymentProvider();
      },
    },
  ],
})
export class PaymentsModule {}
