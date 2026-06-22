import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Purple brand colour
const PURPLE = rgb(0.486, 0.227, 0.929);  // #7c3aed
const DARK   = rgb(0.102, 0.102, 0.18);   // #1a1a2e
const GRAY   = rgb(0.42, 0.447, 0.502);   // #6b7280
const GREEN  = rgb(0.035, 0.627, 0.427);  // #059669
const AMBER  = rgb(0.855, 0.6, 0.086);    // #d97706
const WHITE  = rgb(1, 1, 1);
const LIGHT  = rgb(0.96, 0.96, 0.97);     // near-white row stripe

function fmt(n: number) {
  return `ETB ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

@Injectable()
export class InvoicePdfService {
  async generate(booking: any): Promise<Buffer> {
    const doc  = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    const boldFont   = await doc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await doc.embedFont(StandardFonts.Helvetica);
    const oblique    = await doc.embedFont(StandardFonts.HelveticaOblique);

    let y = height - 40;
    const left  = 48;
    const right = width - 48;

    // ── Helpers ────────────────────────────────────────────────────────────────
    const text = (t: string, x: number, yPos: number, opts: any = {}) => {
      page.drawText(String(t ?? ''), {
        x, y: yPos, size: opts.size ?? 11,
        font: opts.bold ? boldFont : opts.italic ? oblique : normalFont,
        color: opts.color ?? DARK,
        maxWidth: opts.maxWidth,
      });
    };

    const line = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = GRAY) => {
      page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
    };

    const rect = (x: number, yPos: number, w: number, h: number, color: any) => {
      page.drawRectangle({ x, y: yPos, width: w, height: h, color });
    };

    // ── Purple top bar ─────────────────────────────────────────────────────────
    rect(0, height - 6, width, 6, PURPLE);

    // ── Header ─────────────────────────────────────────────────────────────────
    y = height - 54;
    text('PrideHub', left, y, { size: 26, bold: true, color: PURPLE });
    text('Event Management Platform', left, y - 16, { size: 9, color: GRAY });
    text('Addis Ababa, Ethiopia  ·  contact@pridehub.com', left, y - 28, { size: 9, color: GRAY });

    // Invoice label (right side)
    text('INVOICE', right - 100, y, { size: 20, bold: true, color: DARK });
    text(`#${booking.bookingNumber}`, right - 100, y - 16, { size: 10, bold: true, color: PURPLE });
    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    text(`Issued: ${issueDate}`, right - 100, y - 29, { size: 9, color: GRAY });

    // Status badge
    const completedPmts = (booking.payments ?? []).filter((p: any) => p.status === 'COMPLETED');
    const totalPaid    = completedPmts.reduce((s: number, p: any) => s + Number(p.amount), 0);
    const remaining    = Number(booking.totalAmount) - Number(booking.paidAmount);
    const isFullyPaid  = remaining <= 0;
    const badgeText    = isFullyPaid ? 'PAID IN FULL' : 'PARTIALLY PAID';
    const badgeColor   = isFullyPaid ? rgb(0.816, 0.976, 0.894) : rgb(0.996, 0.953, 0.78);
    const badgeTxtClr  = isFullyPaid ? GREEN : AMBER;
    rect(right - 102, y - 52, 102, 18, badgeColor);
    text(badgeText, right - 97, y - 47, { size: 8, bold: true, color: badgeTxtClr });

    y -= 60;
    line(left, y, right, y, 1, PURPLE);
    y -= 24;

    // ── Parties ────────────────────────────────────────────────────────────────
    const midX = left + (right - left) / 2 + 10;

    text('BILL TO', left, y, { size: 8, bold: true, color: GRAY });
    text('SERVICE PROVIDER', midX, y, { size: 8, bold: true, color: GRAY });
    y -= 14;
    text(booking.client?.fullName ?? 'Client', left, y, { size: 12, bold: true });
    text('PrideHub Events', midX, y, { size: 12, bold: true });
    y -= 14;
    text(booking.client?.email ?? '', left, y, { size: 10, color: GRAY });
    text('contact@pridehub.com', midX, y, { size: 10, color: GRAY });
    y -= 12;
    if (booking.client?.phone) {
      text(booking.client.phone, left, y, { size: 10, color: GRAY });
      y -= 12;
    }
    text('Addis Ababa, Ethiopia', midX, y, { size: 10, color: GRAY });

    y -= 28;
    line(left, y, right, y, 0.5);
    y -= 20;

    // ── Event info box ─────────────────────────────────────────────────────────
    rect(left, y - 46, right - left, 56, rgb(0.965, 0.957, 1));
    page.drawRectangle({ x: left, y: y - 46, width: 4, height: 56, color: PURPLE });

    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const colW = (right - left - 4) / 3;

    const infoCol = (label: string, val: string, colX: number) => {
      text(label, colX + 12, y - 4, { size: 8, bold: true, color: PURPLE });
      text(val, colX + 12, y - 18, { size: 10, bold: true });
    };

    infoCol('EVENT TYPE', (booking.eventType ?? '').replace(/_/g, ' '), left);
    infoCol('EVENT DATE', eventDate, left + colW);
    const thirdVal = booking.venue ? `${booking.venue.name}, ${booking.venue.city}` :
                     booking.guestCount ? `${booking.guestCount} guests` : '';
    const thirdLabel = booking.venue ? 'VENUE' : booking.guestCount ? 'GUESTS' : '';
    if (thirdLabel) infoCol(thirdLabel, thirdVal, left + colW * 2);

    y -= 68;

    // ── Payment history table ──────────────────────────────────────────────────
    text('PAYMENT HISTORY', left, y, { size: 8, bold: true, color: GRAY });
    y -= 14;

    // Table header
    const colDate = left;
    const colMethod = left + 110;
    const colRef = left + 210;
    const colAmt = right - 10;

    rect(left, y - 18, right - left, 24, PURPLE);
    text('DATE', colDate + 6, y - 11, { size: 9, bold: true, color: WHITE });
    text('METHOD', colMethod, y - 11, { size: 9, bold: true, color: WHITE });
    text('REFERENCE', colRef, y - 11, { size: 9, bold: true, color: WHITE });
    text('AMOUNT', colAmt - 70, y - 11, { size: 9, bold: true, color: WHITE });
    y -= 24;

    // Table rows
    let rowIndex = 0;
    for (const p of completedPmts) {
      const rowBg = rowIndex % 2 === 0 ? WHITE : LIGHT;
      rect(left, y - 16, right - left, 22, rowBg);

      const pDate = new Date(p.paidAt ?? p.createdAt ?? '').toLocaleDateString('en-US',
        { year: 'numeric', month: 'short', day: 'numeric' });
      text(pDate, colDate + 6, y - 9, { size: 10 });
      text(p.method ?? '', colMethod, y - 9, { size: 10 });
      text(p.transactionRef?.substring(0, 24) ?? '-', colRef, y - 9, { size: 9, color: GRAY });
      const amtStr = fmt(Number(p.amount));
      const amtW = boldFont.widthOfTextAtSize(amtStr, 10);
      text(amtStr, colAmt - amtW, y - 9, { size: 10, bold: true });

      line(left, y - 16, right, y - 16, 0.3, rgb(0.9, 0.9, 0.9));
      y -= 22;
      rowIndex++;
    }

    line(left, y, right, y, 0.5);
    y -= 28;

    // ── Financial summary ──────────────────────────────────────────────────────
    const summaryX = right - 210;
    const summaryW = 210;

    const summaryRow = (label: string, value: string, color: any = DARK, bold = false) => {
      text(label, summaryX + 8, y, { size: 10, color: GRAY });
      const vw = (bold ? boldFont : normalFont).widthOfTextAtSize(value, 10);
      text(value, summaryX + summaryW - 8 - vw, y, { size: 10, bold, color });
      y -= 20;
    };

    rect(summaryX, y - 72, summaryW, 82, LIGHT);
    y -= 8;

    summaryRow('Total Amount', fmt(Number(booking.totalAmount)));
    line(summaryX, y + 4, summaryX + summaryW, y + 4, 0.3, rgb(0.85, 0.85, 0.88));
    summaryRow('Total Paid', fmt(totalPaid), GREEN, true);
    line(summaryX, y + 4, summaryX + summaryW, y + 4, 0.3, rgb(0.85, 0.85, 0.88));
    summaryRow(isFullyPaid ? '✓ Fully Paid' : 'Balance Due', fmt(Math.max(0, remaining)), isFullyPaid ? GREEN : AMBER, true);

    y -= 36;

    // ── Footer ─────────────────────────────────────────────────────────────────
    line(left, y, right, y, 0.5);
    y -= 16;
    text('Thank you for choosing PrideHub Events. Making your events unforgettable.', left, y, { size: 9, color: GRAY, italic: true });
    text('This is a computer-generated document and does not require a signature.', left, y - 13, { size: 9, color: GRAY });

    // Bottom purple bar
    rect(0, 0, width, 5, PURPLE);

    const pdfBytes = await doc.save();
    return Buffer.from(pdfBytes);
  }
}
