import { Module } from '@nestjs/common';
import { AuthModule } from "@iranianoralhistory/auth";
import { PrismaModule } from '@iranianoralhistory/database';

@Module({
  imports: [AuthModule, PrismaModule],
})
export class AppModule {}
