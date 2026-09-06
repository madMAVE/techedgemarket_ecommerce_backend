import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { AdminModule } from "./admin/admin.module";
import { DatabaseModule } from "./common/database/database.module";
import { AppConfigModule } from "./common/config/config.module";
import { SupabaseModule } from "./common/supabase/supabase.module";
import { UploadsModule } from "./common/uploads/uploads.module";

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    SupabaseModule,
    UploadsModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
  ],
})
export class AppModule {}
