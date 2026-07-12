import { Global, Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { STORAGE_SERVICE } from './storage.service.interface';

@Global()
@Module({
  providers: [
    SupabaseStorageService,
    { provide: STORAGE_SERVICE, useExisting: SupabaseStorageService },
  ],
  exports: [STORAGE_SERVICE],
})
export class BackendSharedStorageModule {}
