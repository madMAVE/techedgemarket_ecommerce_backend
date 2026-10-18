import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DocumentsController } from "./documents.controller";
import { PublicDocumentsController } from "./public-documents.controller";
import { DocumentsService } from "./documents.service";
import { AppConfigModule } from "../common/config/config.module";
import { AppConfig } from "../common/config/app.config";

@Module({
  imports: [
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiresIn },
      }),
    }),
  ],
  controllers: [DocumentsController, PublicDocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
