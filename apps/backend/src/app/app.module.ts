import { Module } from '@nestjs/common';
import { AuthModule } from "@iranianoralhistory/auth";
import { PrismaModule } from '@iranianoralhistory/database';
import { UserModule } from "@iranianoralhistory/user";

@Module({
  imports: [AuthModule, PrismaModule, UserModule],
})
export class AppModule {}
