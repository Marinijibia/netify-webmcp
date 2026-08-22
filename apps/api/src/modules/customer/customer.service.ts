import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, CustomerStatus, ContactType } from '@netify/database';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
  CreateCustomerContactInput,
  UpdateCustomerContactInput,
} from '@netify/validation';

@Injectable()
export class CustomerService {
  /**
   * Retrieves a paginated list of customers for the organization with search and filtering.
   */
  async list(organizationId: string, query: CustomerQueryInput) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId };

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          contacts: {
            some: {
              value: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [totalCount, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      }),
    ]);

    return {
      items: customers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: page * pageSize < totalCount,
      },
    };
  }

  /**
   * Retrieves a single customer by ID, ensuring organization boundary isolation.
   */
  async getById(organizationId: string, id: string) {
    if (!organizationId || !id) {
      throw new BadRequestException('Organization ID and Customer ID are required');
    }

    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    return customer;
  }

  /**
   * Atomically creates a Customer and any initial primary contacts.
   */
  async create(organizationId: string, input: CreateCustomerInput) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Customer name cannot be empty');
    }

    const phone = input.phone?.trim() || null;
    const email = input.email?.trim() || null;
    const address = input.address?.trim() || null;
    const notes = input.notes?.trim() || null;

    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          organizationId,
          name: trimmedName,
          phone,
          email,
          address,
          country: input.country || 'NG',
          currency: input.currency || 'NGN',
          status: input.status || CustomerStatus.ACTIVE,
          notes,
          tags: input.tags || [],
          metadata: input.metadata || {},
        },
      });

      if (phone) {
        await tx.customerContact.create({
          data: {
            customerId: customer.id,
            type: ContactType.PHONE,
            value: phone,
            label: 'Primary Phone',
            isPrimary: true,
          },
        });
      }

      if (email) {
        await tx.customerContact.create({
          data: {
            customerId: customer.id,
            type: ContactType.EMAIL,
            value: email,
            label: 'Primary Email',
            isPrimary: true,
          },
        });
      }

      return tx.customer.findUnique({
        where: { id: customer.id },
        include: {
          contacts: {
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });
    });
  }

  /**
   * Updates customer identity and notes, verified against organizationId.
   */
  async update(organizationId: string, id: string, input: UpdateCustomerInput) {
    await this.getById(organizationId, id);

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes ? input.notes.trim() : null;
    if (input.address !== undefined) updateData.address = input.address ? input.address.trim() : null;
    if (input.phone !== undefined) updateData.phone = input.phone ? input.phone.trim() : null;
    if (input.email !== undefined) updateData.email = input.email ? input.email.trim() : null;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    return prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
  }

  /**
   * Soft-archives a customer instead of physical deletion.
   */
  async archive(organizationId: string, id: string) {
    await this.getById(organizationId, id);

    return prisma.customer.update({
      where: { id },
      data: { status: CustomerStatus.ARCHIVED },
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
  }

  /**
   * Retrieves all contacts for a specific customer.
   */
  async getContacts(organizationId: string, customerId: string) {
    await this.getById(organizationId, customerId);

    return prisma.customerContact.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Adds a new contact to a customer, enforcing primary contact category uniqueness.
   */
  async addContact(
    organizationId: string,
    customerId: string,
    input: CreateCustomerContactInput
  ) {
    await this.getById(organizationId, customerId);

    const isPrimary = !!input.isPrimary;

    return prisma.$transaction(async (tx) => {
      if (isPrimary) {
        // Demote existing primary contacts of the same type
        await tx.customerContact.updateMany({
          where: {
            customerId,
            type: input.type,
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      const contact = await tx.customerContact.create({
        data: {
          customerId,
          type: input.type,
          value: input.value.trim(),
          label: input.label ? input.label.trim() : null,
          isPrimary,
        },
      });

      // Synchronize top-level customer phone/email if primary
      if (isPrimary) {
        if (input.type === ContactType.PHONE) {
          await tx.customer.update({
            where: { id: customerId },
            data: { phone: input.value.trim() },
          });
        } else if (input.type === ContactType.EMAIL) {
          await tx.customer.update({
            where: { id: customerId },
            data: { email: input.value.trim() },
          });
        }
      }

      return contact;
    });
  }

  /**
   * Updates an existing contact, enforcing primary contact uniqueness.
   */
  async updateContact(
    organizationId: string,
    customerId: string,
    contactId: string,
    input: UpdateCustomerContactInput
  ) {
    await this.getById(organizationId, customerId);

    const existingContact = await prisma.customerContact.findFirst({
      where: { id: contactId, customerId },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found on this customer');
    }

    const type = input.type || existingContact.type;
    const isPrimary = input.isPrimary !== undefined ? input.isPrimary : existingContact.isPrimary;

    return prisma.$transaction(async (tx) => {
      if (isPrimary && !existingContact.isPrimary) {
        await tx.customerContact.updateMany({
          where: {
            customerId,
            type,
            isPrimary: true,
            id: { not: contactId },
          },
          data: { isPrimary: false },
        });
      }

      const updated = await tx.customerContact.update({
        where: { id: contactId },
        data: {
          type: input.type,
          value: input.value !== undefined ? input.value.trim() : undefined,
          label: input.label !== undefined ? (input.label ? input.label.trim() : null) : undefined,
          isPrimary: input.isPrimary,
        },
      });

      if (isPrimary) {
        if (type === ContactType.PHONE) {
          await tx.customer.update({
            where: { id: customerId },
            data: { phone: updated.value },
          });
        } else if (type === ContactType.EMAIL) {
          await tx.customer.update({
            where: { id: customerId },
            data: { email: updated.value },
          });
        }
      }

      return updated;
    });
  }

  /**
   * Deletes a contact from a customer, verified against organizationId.
   */
  async deleteContact(organizationId: string, customerId: string, contactId: string) {
    await this.getById(organizationId, customerId);

    const existingContact = await prisma.customerContact.findFirst({
      where: { id: contactId, customerId },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found on this customer');
    }

    await prisma.customerContact.delete({
      where: { id: contactId },
    });

    return { success: true, message: 'Contact deleted successfully' };
  }
}
