import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { CommissionModule } from '../commission/commission.module';

@Module({
  imports: [CommissionModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoicePdfService],
  exports: [PaymentsService, InvoicePdfService],
})
export class PaymentsModule {}
