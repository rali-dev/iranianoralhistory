import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from './storage.service.interface';

@Injectable()
export class SupabaseStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private client!: SupabaseClient;
  private bucket!: string;

  onModuleInit(): void {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_SECRET_KEY'];
    const bucket = process.env['SUPABASE_BUCKET'];

    if (!url || !key || !bucket) {
      throw new Error(
        'Fehlende Supabase-Konfiguration: SUPABASE_URL, SUPABASE_SECRET_KEY und SUPABASE_BUCKET müssen gesetzt sein.',
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = bucket;
    this.logger.log(`Supabase Storage initialisiert — Bucket: ${this.bucket}`);
  }

  async createSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      this.logger.error(`Signed URL fehlgeschlagen für ${storagePath}: ${error?.message}`);
      throw new InternalServerErrorException(
        `Dokument-URL konnte nicht erstellt werden: ${error?.message ?? 'Unbekannter Fehler'}`,
      );
    }

    return data.signedUrl;
  }
}
