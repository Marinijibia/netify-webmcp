import { DeterministicInvoiceService } from './deterministic-invoice.service';
import { InvoiceStatus } from '@netify/types';

describe('DeterministicInvoiceService', () => {
  it('should calculate subtotal correctly from items', () => {
    const items = [
      { quantity: 5, unitPrice: 10000 },
      { quantity: 2, unitPrice: 25000 },
    ];
    const subtotal = DeterministicInvoiceService.calculateSubtotal(items);
    expect(subtotal).toBe(100000);
  });

  it('should calculate total with discount and tax correctly', () => {
    const subtotal = 100000;
    const discount = 5000;
    const tax = 7500;
    const total = DeterministicInvoiceService.calculateTotal(subtotal, discount, tax);
    expect(total).toBe(102500);
  });

  it('should calculate balance remaining correctly', () => {
    const total = 102500;
    const paidAmount = 40000;
    const balance = DeterministicInvoiceService.calculateBalance(total, paidAmount);
    expect(balance).toBe(62500);
  });

  it('should determine PAID status when balance is 0', () => {
    const status = DeterministicInvoiceService.determineStatus(50000, 50000, new Date());
    expect(status).toBe(InvoiceStatus.PAID);
  });

  it('should determine OVERDUE status when past due and unpaid', () => {
    const pastDueDate = new Date(Date.now() - 86400000 * 5); // 5 days ago
    const status = DeterministicInvoiceService.determineStatus(50000, 0, pastDueDate);
    expect(status).toBe(InvoiceStatus.OVERDUE);
  });

  it('should determine PARTIALLY_PAID when paid partially and not yet past due', () => {
    const futureDueDate = new Date(Date.now() + 86400000 * 5); // 5 days in future
    const status = DeterministicInvoiceService.determineStatus(50000, 20000, futureDueDate);
    expect(status).toBe(InvoiceStatus.PARTIALLY_PAID);
  });
});
