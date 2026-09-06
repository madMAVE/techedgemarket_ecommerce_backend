import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfig } from "./app.config";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
  ],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class AppConfigModule {}
