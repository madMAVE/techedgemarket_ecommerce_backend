import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DocumentStatus, DocumentType } from "@prisma/client";
import { PrismaService } from "../common/database/prisma.service";
import { CreateDocumentDto, CreateContactDto, DocContactDto, DocPartyDto, UpdateContactDto } from "./dto/document.dto";

const NUMBER_PREFIX: Record<DocumentType, string> = {
  [DocumentType.INVOICE]: "INV",
  [DocumentType.QUOTATION]: "QUO",
  [DocumentType.PURCHASE_ORDER]: "PO",
};

interface DocLineItem {
  id?: string;
  title?: string;
  qty?: number;
  unitPrice?: number;
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, adminId: string) {
    this.assertPayload(dto.payload);

    const partyName = dto.partyName?.trim() || dto.party.name.trim();

    let orderId = dto.orderId;
    if (orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException(`Order ${orderId} not found`);
      const existing = await this.prisma.document.findUnique({ where: { orderId } });
      if (existing) {
        throw new ConflictException(`Order ${order.orderNumber} already has document ${existing.number}`);
      }
    }

    const customer = await this.upsertCustomerFromParty(dto.party, dto.contacts);
    const number = await this.generateNumber(dto.type);

    return this.prisma.document.create({
      data: {
        type: dto.type,
        number,
        issueDate: new Date(dto.issueDate),
        partyName,
        customerId: customer?.id,
        orderId,
        payload: dto.payload as Prisma.InputJsonValue,
        createdBy: adminId,
      },
      include: { customer: { include: { contacts: { where: { isActive: true } } } } },
    });
  }

  async findAll(query: {
    type?: string;
    status?: string;
    customerId?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10) || 20));

    if (query.from && Number.isNaN(new Date(query.from).getTime())) {
      throw new BadRequestException("Invalid from date");
    }
    if (query.to && Number.isNaN(new Date(query.to).getTime())) {
      throw new BadRequestException("Invalid to date");
    }

    const where: Prisma.DocumentWhereInput = {
      ...(query.type ? { type: this.parseEnumValue(DocumentType, query.type, "type") } : {}),
      ...(query.status ? { status: this.parseEnumValue(DocumentStatus, query.status, "status") } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.q
        ? {
            OR: [
              { number: { contains: query.q, mode: "insensitive" } },
              { partyName: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            issueDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where,
        orderBy: { issueDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { id: true, company: true, gstin: true, contacts: { where: { isActive: true }, select: { id: true, name: true, isPrimary: true } } } } },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        customer: { include: { contacts: { where: { isActive: true } } } },
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }

  async updateDraft(id: string, payload: object) {
    this.assertPayload(payload);
    const doc = await this.findOne(id);
    if (doc.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException("Only DRAFT documents can be edited");
    }
    return this.prisma.document.update({
      where: { id },
      data: { payload: payload as Prisma.InputJsonValue },
    });
  }

  async issue(id: string) {
    const doc = await this.findOne(id);
    if (doc.status === DocumentStatus.CANCELLED) {
      throw new BadRequestException("Cancelled documents cannot be issued");
    }
    return this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.ISSUED },
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.CANCELLED },
    });
  }

  async findByPublicToken(token: string) {
    const doc = await this.prisma.document.findUnique({
      where: { publicToken: token },
      select: { id: true, type: true, status: true, number: true, issueDate: true, partyName: true, payload: true },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }

  async getFromOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    const orgAddress = order.orgAddress as unknown as Record<string, string>;
    const existing = await this.prisma.document.findUnique({
      where: { orderId },
      select: { id: true, number: true, status: true },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      alreadyDocumented: existing,
      party: {
        name: order.customerCompany,
        attention: order.customerName,
        mobile: order.mobile,
        email: order.customerEmail,
        address: orgAddress["street"] ?? "",
        city: orgAddress["city"] ?? "",
        state: orgAddress["state"] ?? "",
        stateCode: orgAddress["stateCode"] ?? "",
        gstin: order.customer.gstin ?? undefined,
      } satisfies DocPartyDto,
      lineItems: order.items.map((item) => ({
        productId: item.productId,
        title: item.productName,
        model: item.product.model,
        hsn: item.product.partNumber,
        qty: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalsSnapshot: {
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        discountAmount: order.discountAmount,
        totalAmount: order.totalAmount,
      },
      poReference: order.poReference,
      paymentMethod: order.paymentMethod,
    };
  }

  async listCustomers() {
    return this.prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { company: "asc" },
      include: { contacts: { where: { isActive: true }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] } },
    });
  }

  async listContacts(customerId: string) {
    await this.assertCustomerExists(customerId);
    return this.prisma.contactPerson.findMany({
      where: { customerId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  async addContacts(customerId: string, dto: CreateContactDto) {
    await this.assertCustomerExists(customerId);
    const contact = await this.upsertContact(customerId, dto.contact, dto.contact.isPrimary === true);
    if (dto.contact.isPrimary) await this.enforceSinglePrimary(customerId, contact.id);
    return contact;
  }

  async updateContact(customerId: string, contactId: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contactPerson.findFirst({
      where: { id: contactId, customerId },
    });
    if (!contact) throw new NotFoundException("Contact not found for this customer");

    const updated = await this.prisma.contactPerson.update({
      where: { id: contactId },
      data: {
        name: dto.name,
        role: dto.role,
        mobile: dto.mobile,
        email: dto.email,
        isPrimary: dto.isPrimary,
        isActive: dto.isActive,
      },
    });
    if (dto.isPrimary) await this.enforceSinglePrimary(customerId, contactId);
    return updated;
  }

  async deleteContact(customerId: string, contactId: string) {
    const contact = await this.prisma.contactPerson.findFirst({
      where: { id: contactId, customerId },
    });
    if (!contact) throw new NotFoundException("Contact not found for this customer");
    return this.prisma.contactPerson.update({ where: { id: contactId }, data: { isActive: false } });
  }

  private async assertCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  private assertPayload(payload: object) {
    const items = (payload as { items?: unknown }).items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("payload.items must be a non-empty array");
    }
    const valid = (items as DocLineItem[]).every(
      (item) =>
        typeof item.title === "string" &&
        item.title.trim().length > 0 &&
        typeof item.qty === "number" &&
        item.qty > 0 &&
        typeof item.unitPrice === "number",
    );
    if (!valid) {
      throw new BadRequestException("Each line item needs a title, a positive qty and a unitPrice");
    }
  }

  private parseEnumValue<T extends Record<string, string>>(enumObj: T, value: string, field: string): T[keyof T] {
    const upper = value.toUpperCase();
    const match = Object.values(enumObj).find((v) => v === upper);
    if (!match) throw new BadRequestException(`Invalid ${field}: ${value}`);
    return match as T[keyof T];
  }

  private fiscalPeriod(): string {
    // Indian fiscal year Apr-Mar, computed in IST
    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const year = ist.getUTCFullYear();
    const month = ist.getUTCMonth();
    const start = month >= 3 ? year : year - 1;
    return `${start}-${start + 1}`;
  }

  private async generateNumber(type: DocumentType): Promise<string> {
    const period = this.fiscalPeriod();
    await this.prisma.documentSequence.upsert({
      where: { type_period: { type, period } },
      create: { type, period, lastNumber: 0 },
      update: {},
    });
    const row = await this.prisma.documentSequence.update({
      where: { type_period: { type, period } },
      data: { lastNumber: { increment: 1 } },
    });
    return `${NUMBER_PREFIX[type]}-${period.split("-")[0]}-${String(row.lastNumber).padStart(4, "0")}`;
  }

  private async upsertCustomerFromParty(party: DocPartyDto, contacts?: DocContactDto[]) {
    const company = party.name.trim();
    if (!company) return null;

    let customer: { id: string } | null = null;
    if (party.gstin?.trim()) {
      customer = await this.prisma.customer.findUnique({ where: { gstin: party.gstin.trim() } });
    }
    if (!customer) {
      customer = await this.prisma.customer.findFirst({
        where: { company: { equals: company, mode: "insensitive" } },
      });
    }

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          company,
          gstin: party.gstin?.trim() || undefined,
          mobile: party.mobile || undefined,
          email: party.email || undefined,
          address: party.address || undefined,
          city: party.city || undefined,
          state: party.state || undefined,
          stateCode: party.stateCode || undefined,
        },
      });
    }

    if (customer) {
      await this.fillEmptyCustomerFields(customer.id, party);
      const contactSeed: DocContactDto[] = [];
      if (party.attention?.trim()) {
        contactSeed.push({
          name: party.attention.trim(),
          mobile: party.mobile,
          email: party.email,
          role: undefined,
          isPrimary: undefined,
        });
      }
      for (const contact of contacts ?? []) {
        contactSeed.push(contact);
      }
      for (const [index, contact] of contactSeed.entries()) {
        const saved = await this.upsertContact(customer.id, contact, index === 0 && contact.isPrimary !== false);
        if (contact.isPrimary) await this.enforceSinglePrimary(customer.id, saved.id);
      }
    }

    return customer;
  }

  private async fillEmptyCustomerFields(customerId: string, party: DocPartyDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;
    const data: Prisma.CustomerUpdateInput = {};
    if (!customer.gstin && party.gstin?.trim()) data.gstin = party.gstin.trim();
    if (!customer.mobile && party.mobile) data.mobile = party.mobile;
    if (!customer.email && party.email) data.email = party.email;
    if (!customer.address && party.address) data.address = party.address;
    if (!customer.city && party.city) data.city = party.city;
    if (!customer.state && party.state) data.state = party.state;
    if (!customer.stateCode && party.stateCode) data.stateCode = party.stateCode;
    if (Object.keys(data).length > 0) {
      await this.prisma.customer.update({ where: { id: customerId }, data });
    }
  }

  private async upsertContact(customerId: string, contact: DocContactDto, setPrimary: boolean) {
    const existing = await this.findExistingContact(customerId, contact);
    if (existing) {
      const data: Prisma.ContactPersonUpdateInput = {};
      if (!existing.role && contact.role) data.role = contact.role;
      if (!existing.mobile && contact.mobile) data.mobile = contact.mobile;
      if (!existing.email && contact.email) data.email = contact.email;
      if (setPrimary) data.isPrimary = true;
      if (!existing.isActive) data.isActive = true;
      return this.prisma.contactPerson.update({ where: { id: existing.id }, data });
    }
    return this.prisma.contactPerson.create({
      data: {
        customerId,
        name: contact.name.trim(),
        role: contact.role || undefined,
        mobile: contact.mobile || undefined,
        email: contact.email || undefined,
        isPrimary: setPrimary,
      },
    });
  }

  private async findExistingContact(customerId: string, contact: DocContactDto) {
    if (contact.email?.trim()) {
      const found = await this.prisma.contactPerson.findFirst({
        where: { customerId, email: { equals: contact.email.trim(), mode: "insensitive" } },
      });
      if (found) return found;
    }
    if (contact.mobile?.trim()) {
      const found = await this.prisma.contactPerson.findFirst({
        where: { customerId, mobile: contact.mobile.trim() },
      });
      if (found) return found;
    }
    const name = contact.name.trim().toLowerCase();
    const candidates = await this.prisma.contactPerson.findMany({ where: { customerId } });
    return candidates.find((c) => c.name.trim().toLowerCase() === name) ?? null;
  }

  private async enforceSinglePrimary(customerId: string, primaryId: string) {
    await this.prisma.contactPerson.updateMany({
      where: { customerId, id: { not: primaryId }, isPrimary: true },
      data: { isPrimary: false },
    });
  }
}
