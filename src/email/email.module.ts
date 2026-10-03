import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailSignatureService } from "./email-signature.service";
import { EmailSignatureController } from "./email-signature.controller";
import { PrismaService } from "../common/database/prisma.service";

@Module({
  controllers: [EmailSignatureController],
  providers: [EmailService, EmailSignatureService, PrismaService],
  exports: [EmailService, EmailSignatureService],
})
export class EmailModule {}
