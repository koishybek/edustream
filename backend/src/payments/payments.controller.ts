import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/types';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** POST /courses/:id/checkout — buy a course (dev mock enrolls instantly). */
  @UseGuards(JwtAuthGuard)
  @Post('courses/:id/checkout')
  @HttpCode(HttpStatus.OK)
  checkout(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payments.checkout(user.sub, id);
  }

  /** POST /payments/webhook — Stripe confirmation (dev: JSON passthrough). */
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() body: { orderId?: string }) {
    return this.payments.handleWebhook(body);
  }
}
