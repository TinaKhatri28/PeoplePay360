import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { maskBankAccount } from '../../shared/utils/masking.util';
import { cacheService } from '../../shared/utils/cache.service';

export class PayslipPdfService {
  private renderPdfContent(doc: PDFKit.PDFDocument, payslip: any): void {
    const empName = payslip.employee 
      ? `${payslip.employee.first_name} ${payslip.employee.last_name}` 
      : 'Employee';
    const periodStr = payslip.payrun 
      ? `${payslip.payrun.period_month}/${payslip.payrun.period_year}` 
      : 'Current Period';

    // Header
    doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('PeoplePay360', 40, 40);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Enterprise HR & Payroll Management System', 40, 68);

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('OFFICIAL PAYSLIP', 400, 40, { align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Period: ${periodStr}`, 400, 62, { align: 'right' });
    doc.text(`Status: ${payslip.status}`, 400, 76, { align: 'right' });

    doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Employee & Contract Info Box
    doc.rect(40, 110, 515, 75).fillColor('#f8fafc').fillAndStroke('#e2e8f0');
    doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold');
    doc.text('Employee Information', 55, 122);
    doc.text('Payment Information', 320, 122);

    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    doc.text(`Name: ${empName}`, 55, 138);
    doc.text(`Email: ${payslip.employee?.email || 'N/A'}`, 55, 152);
    doc.text(`Position: ${payslip.employee?.position || 'Staff'}`, 55, 166);

    const maskedAccount = maskBankAccount(payslip.employee?.bank_account);
    doc.text(`Bank Account: ${maskedAccount}`, 320, 138);
    doc.text(`Payslip ID: ${payslip.id.slice(0, 13)}...`, 320, 152);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 320, 166);

    // Earnings & Deductions Table Header
    let y = 205;
    doc.rect(40, y, 515, 24).fillColor('#0f172a').fill();
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Description / Rule', 55, y + 6);
    doc.text('Category', 300, y + 6);
    doc.text('Amount ($)', 450, y + 6, { align: 'right', width: 90 });

    y += 24;

    let lines: any[] = [];
    try {
      lines = typeof payslip.lines_json === 'string' ? JSON.parse(payslip.lines_json) : (payslip.lines || []);
    } catch {
      lines = [];
    }

    doc.font('Helvetica').fontSize(9);
    for (const line of lines) {
      const isDeduction = line.category === 'Deduction';
      doc.rect(40, y, 515, 22).fillColor(y % 44 === 0 ? '#f8fafc' : '#ffffff').fill();
      doc.fillColor('#1e293b').text(line.name, 55, y + 6);
      doc.fillColor(isDeduction ? '#dc2626' : '#16a34a').text(line.category, 300, y + 6);
      doc.fillColor('#0f172a').text(
        `${isDeduction ? '-' : ''}$${Math.abs(line.amount).toFixed(2)}`,
        450,
        y + 6,
        { align: 'right', width: 90 }
      );
      y += 22;
    }

    // Totals Box
    y += 15;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#cbd5e1').stroke();
    y += 10;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#334155');
    doc.text('Gross Earnings:', 320, y);
    doc.text(`$${Number(payslip.gross).toFixed(2)}`, 450, y, { align: 'right', width: 90 });

    y += 18;
    doc.text('Total Deductions:', 320, y);
    doc.fillColor('#dc2626').text(`-$${Number(payslip.deductions).toFixed(2)}`, 450, y, { align: 'right', width: 90 });

    y += 22;
    doc.rect(300, y - 4, 255, 28).fillColor('#f1f5f9').fill();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a');
    doc.text('NET SALARY:', 320, y + 3);
    doc.fillColor('#059669').text(`$${Number(payslip.net).toFixed(2)}`, 450, y + 3, { align: 'right', width: 90 });

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
    doc.text(
      'This is a system-generated document from PeoplePay360. No physical signature is required.',
      40,
      760,
      { align: 'center', width: 515 }
    );
  }

  async generatePayslipPdfBuffer(payslip: any): Promise<Buffer> {
    const cacheKey = `pdf:payslip:${payslip.id}`;
    const cachedBase64 = await cacheService.get<string>(cacheKey);
    if (cachedBase64) {
      return Buffer.from(cachedBase64, 'base64');
    }

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderPdfContent(doc, payslip);
      doc.end();
    });

    // Cache PDF buffer base64 for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, buffer.toString('base64'), 3600);
    return buffer;
  }

  async generatePayslipPdf(payslip: any, stream: Response): Promise<void> {
    const buffer = await this.generatePayslipPdfBuffer(payslip);
    stream.end(buffer);
  }
}

export const payslipPdfService = new PayslipPdfService();
