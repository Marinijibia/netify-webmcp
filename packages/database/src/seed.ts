import {
  PrismaClient,
  UserRole,
  CustomerStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  ReceivableStatus,
  ReceivableSource,
  CommitmentStatus,
  CommitmentSource,
  ConfidenceLevel,
  RiskLevel,
  CommunicationChannel,
  MessageSenderType,
  BusinessEventType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting realistic African SME database seed for Netify...');

  // Clean existing demo data safely
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.aIAction.deleteMany({});
  await prisma.aIInsight.deleteMany({});
  await prisma.memoryItem.deleteMany({});
  await prisma.riskAssessment.deleteMany({});
  await prisma.businessMemory.deleteMany({});
  await prisma.businessEvent.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.paymentCommitment.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.receivable.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.entitlement.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // 1. Create Organization: Netify
  const org = await prisma.organization.create({
    data: {
      name: 'Netify',
      slug: 'netify',
      currency: 'NGN',
      country: 'Nigeria',
      settings: {
        industry: 'FMCG & Wholesale Distribution',
        state: 'Lagos',
        defaultPaymentTermsDays: 14,
      },
    },
  });

  // 2. Create Owner User
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'owner@netify.ng',
      passwordHash,
      firstName: 'Tunde',
      lastName: 'Balogun',
      phone: '+2348031234567',
      isEmailVerified: true,
      emailVerifiedAt: now,
      onboardingCompleted: true,
    },
  });

  await prisma.membership.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: UserRole.OWNER,
    },
  });

  // 2b. Create Web Demo User (for Hackathon Judges - auto-verified)
  const demoUser = await prisma.user.create({
    data: {
      email: 'merchant@netify.ng',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Merchant',
      phone: '+2348000000000',
      isEmailVerified: true,
      emailVerifiedAt: now,
      onboardingCompleted: true,
    },
  });

  await prisma.membership.create({
    data: {
      organizationId: org.id,
      userId: demoUser.id,
      role: UserRole.ADMIN,
    },
  });

  // Subscriptions & Entitlements
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: daysAgo(10),
      currentPeriodEnd: daysAhead(20),
      revenueCatId: 'rc_sub_netify_pro',
    },
  });

  await prisma.entitlement.createMany({
    data: [
      { organizationId: org.id, feature: 'ai_investigation', isEnabled: true, limit: 1000, usage: 42 },
      { organizationId: org.id, feature: 'unlimited_customers', isEnabled: true },
      { organizationId: org.id, feature: 'whatsapp_drafting', isEnabled: true },
    ],
  });

  // 3. Create Key Customers
  // Customer 1: ABC Stores (HIGH RISK - Core Demo Star)
  const abcStores = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: 'ABC Stores',
      phone: '+2348029988771',
      email: 'procurement@abcstores.ng',
      address: 'Plot 14 Commercial Ave, Ikeja, Lagos',
      country: 'Nigeria',
      currency: 'NGN',
      status: CustomerStatus.ACTIVE,
      notes: 'Major retail chain outlet in Ikeja. Historically takes long to clear large invoices.',
      tags: ['Retail', 'Key Account', 'High Volume'],
    },
  });

  // Customer 2: Musa Enterprises (MEDIUM RISK - Promised Payment Due Soon)
  const musaEnt = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: 'Musa Enterprises',
      phone: '+2348051122334',
      email: 'musa@musaenterprises.com',
      address: '22 Kano St, Central Business District, Abuja',
      country: 'Nigeria',
      currency: 'NGN',
      status: CustomerStatus.ACTIVE,
      notes: 'Wholesale distributor for northern region. Always pays after verbal reminders.',
      tags: ['Wholesale', 'Northern Region'],
    },
  });

  // Customer 3: Greenfield Supplies (LOW RISK - Prompt Payer)
  const greenfield = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: 'Greenfield Supplies',
      phone: '+2348074455667',
      email: 'accounts@greenfield.ng',
      address: '8 Trans-Amadi Road, Port Harcourt',
      country: 'Nigeria',
      currency: 'NGN',
      status: CustomerStatus.ACTIVE,
      notes: 'Very reliable corporate supply client. Direct bank transfer on invoice approval.',
      tags: ['Corporate', 'FMCG'],
    },
  });

  // Customer 4: Northern Distribution (HIGH RISK - Multiple Overdue Invoices)
  const northernDist = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: 'Northern Distribution',
      phone: '+2348098877665',
      email: 'ops@northerndist.ng',
      address: '10 Ahmadu Bello Way, Kaduna',
      country: 'Nigeria',
      currency: 'NGN',
      status: CustomerStatus.ACTIVE,
      notes: 'Branch logistics hub. Experiencing cash-flow delays due to inter-state transit issues.',
      tags: ['Logistics', 'Wholesale'],
    },
  });

  // 4. Create Invoices & Authoritative Receivables
  // ABC Stores: Total Outstanding = 850,000 NGN (Overdue 21d and 6d)
  const invABC1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      invoiceNumber: 'INV-102',
      issueDate: daysAgo(35),
      dueDate: daysAgo(21), // 21 days overdue
      subtotal: 500000,
      discount: 0,
      tax: 0,
      total: 500000,
      paidAmount: 0,
      balance: 500000,
      currency: 'NGN',
      status: InvoiceStatus.OVERDUE,
      notes: 'Supply of 50 cartons of premium vegetable oil',
      items: {
        create: [
          { description: 'Premium Cooking Oil 25L x 50 cartons', quantity: 50, unitPrice: 10000, amount: 500000 },
        ],
      },
    },
  });

  const recABC1 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      reference: 'INV-102',
      description: 'Supply of 50 cartons of premium vegetable oil',
      originalAmount: 500000,
      currency: 'NGN',
      issuedAt: daysAgo(35),
      dueDate: daysAgo(21),
      status: ReceivableStatus.OPEN,
      source: ReceivableSource.INVOICE,
      notes: 'Supply of 50 cartons of premium vegetable oil',
    },
  });

  const invABC2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      invoiceNumber: 'INV-115',
      issueDate: daysAgo(20),
      dueDate: daysAgo(6), // 6 days overdue
      subtotal: 350000,
      discount: 0,
      tax: 0,
      total: 350000,
      paidAmount: 0,
      balance: 350000,
      currency: 'NGN',
      status: InvoiceStatus.OVERDUE,
      notes: 'Supply of packaged flour and grains',
      items: {
        create: [
          { description: 'Bulk Packaged Flour 50kg x 10 bags', quantity: 10, unitPrice: 35000, amount: 350000 },
        ],
      },
    },
  });

  const recABC2 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      reference: 'INV-115',
      description: 'Supply of packaged flour and grains',
      originalAmount: 350000,
      currency: 'NGN',
      issuedAt: daysAgo(20),
      dueDate: daysAgo(6),
      status: ReceivableStatus.OPEN,
      source: ReceivableSource.INVOICE,
      notes: 'Supply of packaged flour and grains',
    },
  });

  // Musa Enterprises: Total Outstanding = 450,000 NGN (due today!)
  const invMusa1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: musaEnt.id,
      invoiceNumber: 'INV-120',
      issueDate: daysAgo(13),
      dueDate: now, // due today
      subtotal: 450000,
      discount: 0,
      tax: 0,
      total: 450000,
      paidAmount: 0,
      balance: 450000,
      currency: 'NGN',
      status: InvoiceStatus.ISSUED,
      notes: 'Beverages and canned goods bulk consignment',
      items: {
        create: [
          { description: 'Assorted Canned Goods Pallet', quantity: 3, unitPrice: 150000, amount: 450000 },
        ],
      },
    },
  });

  const recMusa1 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: musaEnt.id,
      reference: 'INV-120',
      description: 'Beverages and canned goods bulk consignment',
      originalAmount: 450000,
      currency: 'NGN',
      issuedAt: daysAgo(13),
      dueDate: now, // due today
      status: ReceivableStatus.OPEN,
      source: ReceivableSource.INVOICE,
      notes: 'Beverages and canned goods bulk consignment',
    },
  });

  // Northern Distribution: Total Outstanding = 1,200,000 NGN (with partial payment)
  const invNorth1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      invoiceNumber: 'INV-098',
      issueDate: daysAgo(50),
      dueDate: daysAgo(36), // 36 days overdue
      subtotal: 1200000,
      discount: 0,
      tax: 0,
      total: 1200000,
      paidAmount: 400000,
      balance: 800000,
      currency: 'NGN',
      status: InvoiceStatus.OVERDUE,
      notes: 'Direct consignment for Kaduna warehouse',
      items: {
        create: [
          { description: 'Industrial Grain Supply 10 Tons', quantity: 1, unitPrice: 1200000, amount: 1200000 },
        ],
      },
    },
  });

  const recNorth1 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      reference: 'INV-098',
      description: 'Industrial Grain Supply 10 Tons',
      originalAmount: 1200000,
      currency: 'NGN',
      issuedAt: daysAgo(50),
      dueDate: daysAgo(36),
      status: ReceivableStatus.PARTIALLY_PAID,
      source: ReceivableSource.INVOICE,
      notes: 'Direct consignment for Kaduna warehouse',
    },
  });

  const invNorth2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      invoiceNumber: 'INV-118',
      issueDate: daysAgo(18),
      dueDate: daysAgo(4), // 4 days overdue
      subtotal: 400000,
      discount: 0,
      tax: 0,
      total: 400000,
      paidAmount: 0,
      balance: 400000,
      currency: 'NGN',
      status: InvoiceStatus.OVERDUE,
      notes: 'Seasoning and condiments batch',
      items: {
        create: [
          { description: 'Food Seasoning Packs x 100 cartons', quantity: 100, unitPrice: 4000, amount: 400000 },
        ],
      },
    },
  });

  const recNorth2 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      reference: 'INV-118',
      description: 'Seasoning and condiments batch',
      originalAmount: 400000,
      currency: 'NGN',
      issuedAt: daysAgo(18),
      dueDate: daysAgo(4),
      status: ReceivableStatus.OPEN,
      source: ReceivableSource.INVOICE,
      notes: 'Seasoning and condiments batch',
    },
  });

  // Greenfield Supplies: Fully paid invoice
  const invGreen1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      customerId: greenfield.id,
      invoiceNumber: 'INV-110',
      issueDate: daysAgo(25),
      dueDate: daysAgo(11),
      subtotal: 900000,
      discount: 0,
      tax: 0,
      total: 900000,
      paidAmount: 900000,
      balance: 0,
      currency: 'NGN',
      status: InvoiceStatus.PAID,
      notes: 'Port Harcourt hospital canteen supply contract',
      items: {
        create: [
          { description: 'Catering Supplies Grade A', quantity: 1, unitPrice: 900000, amount: 900000 },
        ],
      },
    },
  });

  const recGreen1 = await prisma.receivable.create({
    data: {
      organizationId: org.id,
      customerId: greenfield.id,
      reference: 'INV-110',
      description: 'Catering Supplies Grade A',
      originalAmount: 900000,
      currency: 'NGN',
      issuedAt: daysAgo(25),
      dueDate: daysAgo(11),
      status: ReceivableStatus.PAID,
      source: ReceivableSource.INVOICE,
      notes: 'Port Harcourt hospital canteen supply contract',
    },
  });

  // 5. Create Payments & Ledger Transactions
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      receivableId: recNorth1.id,
      invoiceId: invNorth1.id,
      amount: 400000,
      currency: 'NGN',
      paidAt: daysAgo(20),
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.CONFIRMED,
      reference: 'GTB-TRF-299104882',
      notes: 'Part-payment for INV-098 / REC-098 via GTBank transfer',
      source: 'Bank Transfer',
    },
  });

  await prisma.payment.create({
    data: {
      organizationId: org.id,
      customerId: greenfield.id,
      receivableId: recGreen1.id,
      invoiceId: invGreen1.id,
      amount: 900000,
      currency: 'NGN',
      paidAt: daysAgo(15),
      method: PaymentMethod.BANK_TRANSFER,
      status: PaymentStatus.CONFIRMED,
      reference: 'ZENITH-NIP-88192019',
      notes: 'Full payment for INV-110 / REC-110 via Zenith Bank NIP',
      source: 'Direct Transfer',
    },
  });

  // 6. Create Commitments (Promises to Pay) & PaymentCommitments
  // ABC Stores: Promised 300,000 NGN on Friday (MISSED)
  const commABC = await prisma.commitment.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      invoiceId: invABC1.id,
      amount: 300000,
      currency: 'NGN',
      promisedDate: daysAgo(3), // Promised 3 days ago and was missed!
      description: "Manager promised: 'I will send ₦300,000 on Friday once directors sign off.'",
      source: CommitmentSource.CONVERSATION,
      sourceReference: 'WhatsApp Call with Mr. Segun',
      confidence: ConfidenceLevel.HIGH,
      status: CommitmentStatus.MISSED,
    },
  });

  await prisma.paymentCommitment.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      receivableId: recABC1.id,
      createdByUserId: user.id,
      amount: 300000,
      currency: 'NGN',
      promisedFor: daysAgo(3),
      status: CommitmentStatus.MISSED,
      notes: "Manager promised: 'I will send ₦300,000 on Friday once directors sign off.'",
    },
  });

  // Musa Enterprises: Promised 450,000 NGN TODAY (PENDING)
  await prisma.commitment.create({
    data: {
      organizationId: org.id,
      customerId: musaEnt.id,
      invoiceId: invMusa1.id,
      amount: 450000,
      currency: 'NGN',
      promisedDate: now,
      description: "Alhaji Musa confirmed: 'Goods arrived safely. Transfer will be done by noon Friday.'",
      source: CommitmentSource.CONVERSATION,
      sourceReference: 'WhatsApp Message Chat',
      confidence: ConfidenceLevel.HIGH,
      status: CommitmentStatus.PENDING,
    },
  });

  await prisma.paymentCommitment.create({
    data: {
      organizationId: org.id,
      customerId: musaEnt.id,
      receivableId: recMusa1.id,
      createdByUserId: user.id,
      amount: 450000,
      currency: 'NGN',
      promisedFor: now,
      status: CommitmentStatus.PENDING,
      notes: "Alhaji Musa confirmed: 'Goods arrived safely. Transfer will be done by noon Friday.'",
    },
  });

  // Northern Distribution: Missed commitment
  await prisma.commitment.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      invoiceId: invNorth1.id,
      amount: 800000,
      currency: 'NGN',
      promisedDate: daysAgo(10),
      description: "Agreed to settle balance before month end",
      source: CommitmentSource.MANUAL,
      sourceReference: 'Phone call log',
      confidence: ConfidenceLevel.MEDIUM,
      status: CommitmentStatus.MISSED,
    },
  });

  await prisma.paymentCommitment.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      receivableId: recNorth1.id,
      createdByUserId: user.id,
      amount: 800000,
      currency: 'NGN',
      promisedFor: daysAgo(10),
      status: CommitmentStatus.MISSED,
      notes: 'Agreed to settle balance before month end',
    },
  });

  // 7. Create Conversations & Messages
  const convABC = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      channel: CommunicationChannel.WHATSAPP,
      title: 'Payment Follow-up INV-102',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: convABC.id,
        senderType: MessageSenderType.BUSINESS,
        senderName: 'Tunde Balogun',
        content: 'Good day Mr. Segun, just checking in on invoice INV-102 for ₦500,000 which was due last week.',
        timestamp: daysAgo(6),
      },
      {
        conversationId: convABC.id,
        senderType: MessageSenderType.CUSTOMER,
        senderName: 'Segun (ABC Stores)',
        content: "Hello Alhaji Tunde, apologies for the slight delay. Our accountant was on leave. I will send ₦300,000 on Friday morning without fail, then clear the rest next week.",
        timestamp: daysAgo(5),
      },
      {
        conversationId: convABC.id,
        senderType: MessageSenderType.BUSINESS,
        senderName: 'Tunde Balogun',
        content: 'Noted with thanks. We await the ₦300,000 on Friday.',
        timestamp: daysAgo(5),
      },
    ],
  });

  // 8. Create Business Events
  await prisma.businessEvent.createMany({
    data: [
      {
        organizationId: org.id,
        customerId: abcStores.id,
        type: BusinessEventType.RECEIVABLE_OVERDUE,
        occurredAt: daysAgo(21),
        data: { amount: 500000 },
      },
      {
        organizationId: org.id,
        customerId: abcStores.id,
        type: BusinessEventType.PAYMENT_COMMITMENT_MISSED,
        occurredAt: daysAgo(3),
        data: { amount: 300000 },
      },
      {
        organizationId: org.id,
        customerId: musaEnt.id,
        type: BusinessEventType.PAYMENT_COMMITMENT_CREATED,
        occurredAt: daysAgo(2),
        data: { amount: 450000, promisedFor: daysAhead(1).toISOString() },
      },
    ],
  });

  // 9. Create Risk Assessments with Deterministic Signals & AI Explanations
  await prisma.riskAssessment.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      riskLevel: RiskLevel.HIGH,
      riskScore: 78,
      signals: {
        totalOutstanding: 850000,
        oldestOverdueDays: 21,
        overdueInvoicesCount: 2,
        missedCommitmentsCount: 1,
        fulfilledCommitmentsCount: 0,
        averagePaymentDelayDays: 14,
        daysSinceLastPayment: null,
      },
      aiExplanation:
        'ABC Stores is rated HIGH RISK because they carry ₦850,000 across 2 overdue invoices (oldest is 21 days late) and missed a specific ₦300,000 commitment made for Friday without prior notice.',
      evaluatedAt: now,
    },
  });

  await prisma.riskAssessment.create({
    data: {
      organizationId: org.id,
      customerId: northernDist.id,
      riskLevel: RiskLevel.CRITICAL,
      riskScore: 88,
      signals: {
        totalOutstanding: 1200000,
        oldestOverdueDays: 36,
        overdueInvoicesCount: 2,
        missedCommitmentsCount: 1,
        averagePaymentDelayDays: 25,
      },
      aiExplanation:
        'Northern Distribution has an outstanding balance of ₦1,200,000 with the oldest invoice now 36 days overdue. Although a ₦400,000 partial payment was received 20 days ago, a subsequent commitment was missed.',
      evaluatedAt: now,
    },
  });

  // 10. Create AI Actions
  await prisma.aIAction.create({
    data: {
      organizationId: org.id,
      customerId: abcStores.id,
      type: 'SEND_PAYMENT_REMINDER',
      title: 'Follow up on missed ₦300,000 commitment',
      description: 'Send a polite but clear WhatsApp reminder referencing Mr. Segun’s Friday commitment.',
      payload: {
        customerId: abcStores.id,
        suggestedAmount: 300000,
        channel: 'whatsapp',
      },
      status: 'SUGGESTED',
    },
  });

  console.log('✅ African SME Seed data successfully loaded for Netify!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
