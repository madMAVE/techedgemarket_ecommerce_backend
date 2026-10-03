import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/database/prisma.service";
import { CreateEmailSignatureDto, UpdateEmailSignatureDto } from "./dto/email-signature.dto";

@Injectable()
export class EmailSignatureService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailSignature.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const signature = await this.prisma.emailSignature.findUnique({ where: { id } });
    if (!signature) throw new NotFoundException("Email signature not found");
    return signature;
  }

  async create(dto: CreateEmailSignatureDto) {
    if (dto.isActive) {
      await this.prisma.emailSignature.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }
    return this.prisma.emailSignature.create({ data: dto });
  }

  async update(id: string, dto: UpdateEmailSignatureDto) {
    await this.findOne(id);

    if (dto.isActive) {
      await this.prisma.emailSignature.updateMany({ where: { id: { not: id }, isActive: true }, data: { isActive: false } });
    }

    return this.prisma.emailSignature.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.emailSignature.delete({ where: { id } });
  }

  async getActiveSignature() {
    const active = await this.prisma.emailSignature.findFirst({ where: { isActive: true } });
    return active?.content || null;
  }
}
