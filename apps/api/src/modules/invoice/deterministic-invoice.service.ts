import { InvoiceStatus } from '@netify/types';

export interface CalculatedInvoiceValues {
  subtotal: number;
  total: number;
  balance: number;
  status: InvoiceStatus;
  daysOverdue: number;
}

export class DeterministicInvoiceService {
  /**
   * Deterministically calculates invoice subtotal from line items.
   */
  static calculateSubtotal(items: Array<{ quantity: number; unitPrice: number }>): number {
    return items.reduce((sum, item) => sum + Math.max(0, item.quantity * item.unitPrice), 0);
  }

  /**
   * Deterministically calculates total = subtotal - discount + tax.
   */
  static calculateTotal(subtotal: number, discount: number = 0, tax: number = 0): number {
    const afterDiscount = Math.max(0, subtotal - Math.max(0, discount));
    return afterDiscount + Math.max(0, tax);
  }

  /**
   * Deterministically calculates remaining balance = total - paidAmount.
   */
  static calculateBalance(total: number, paidAmount: number = 0): number {
    return Math.max(0, total - Math.max(0, paidAmount));
  }

  /**
   * Calculates days overdue relative to reference date.
   */
  static calculateDaysOverdue(dueDate: Date | string, referenceDate: Date = new Date()): number {
    const due = new Date(dueDate).getTime();
    const ref = referenceDate.getTime();
    const diffDays = Math.floor((ref - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Determines invoice status deterministically based on paid amount, balance, and due date.
   */
  static determineStatus(
    total: number,
    paidAmount: number,
    dueDate: Date | string,
    currentStatus?: InvoiceStatus | string,
    referenceDate: Date = new Date()
  ): InvoiceStatus {
    if (currentStatus === InvoiceStatus.CANCELLED || currentStatus === 'CANCELLED') {
      return InvoiceStatus.CANCELLED;
    }
    if (currentStatus === InvoiceStatus.DRAFT || currentStatus === 'DRAFT') {
      return InvoiceStatus.DRAFT;
    }

    const balance = this.calculateBalance(total, paidAmount);

    if (balance <= 0 && total > 0) {
      return InvoiceStatus.PAID;
    }

    const isPastDue = new Date(dueDate).getTime() < referenceDate.getTime();

    if (paidAmount > 0 && balance > 0) {
      return isPastDue ? InvoiceStatus.OVERDUE : InvoiceStatus.PARTIALLY_PAID;
    }

    if (isPastDue && balance > 0) {
      return InvoiceStatus.OVERDUE;
    }

    return InvoiceStatus.ISSUED;
  }
}
