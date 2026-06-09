import { Module } from '@nestjs/common';
import { AuthModule } from "@iranianoralhistory/auth";

@Module({
  imports: [AuthModule],
})
export class AppModule {}
