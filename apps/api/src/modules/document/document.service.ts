import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, DocumentType, DocumentStatus } from '@netify/database';

@Injectable()
export class DocumentService {
  async list(organizationId: string, customerId?: string) {
    const where: any = { organizationId };
    if (customerId) where.customerId = customerId;

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async create(organizationId: string, input: {
    customerId?: string;
    name: string;
    type: DocumentType;
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  }) {
    return prisma.document.create({
      data: {
        organizationId,
        customerId: input.customerId,
        name: input.name,
        type: input.type,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        status: DocumentStatus.UPLOADED,
      },
    });
  }
}
