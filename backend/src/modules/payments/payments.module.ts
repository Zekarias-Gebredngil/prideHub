import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoicePdfService],
  exports: [PaymentsService, InvoicePdfService],
})
export class PaymentsModule {}
