import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailSignatureService } from "./email-signature.service";
import { EmailSignatureController } from "./email-signature.controller";

@Module({
  controllers: [EmailSignatureController],
  providers: [EmailService, EmailSignatureService],
  exports: [EmailService, EmailSignatureService],
})
export class EmailModule {}
