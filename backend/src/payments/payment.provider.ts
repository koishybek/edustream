export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface CheckoutInput {
  orderId: string;
  amountCents: number;
  currency: string;
  courseTitle: string;
}

export interface CheckoutResult {
  status: 'paid' | 'pending';
  url?: string;
}

export interface PaymentProvider {
  checkout(input: CheckoutInput): Promise<CheckoutResult>;
}

/** Dev provider: payment succeeds instantly (no external call). */
export class MockPaymentProvider implements PaymentProvider {
  async checkout(): Promise<CheckoutResult> {
    return { status: 'paid' };
  }
}

/** Stripe test-mode stub — used only when STRIPE_SECRET_KEY is set. */
export class StripePaymentProvider implements PaymentProvider {
  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    // TODO(stripe): create a real test-mode Checkout Session via the Stripe SDK
    // and return its hosted URL; the webhook then confirms payment.
    return {
      status: 'pending',
      url: `https://checkout.stripe.test/session/${input.orderId}`,
    };
  }
}
