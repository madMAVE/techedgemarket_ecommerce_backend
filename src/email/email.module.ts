import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailSignatureService } from "./email-signature.service";

@Module({
  providers: [EmailService, EmailSignatureService],
  exports: [EmailService, EmailSignatureService],
})
export class EmailModule {}
