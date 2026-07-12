import { InternalServerErrorException } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

const mockCreateSignedUrl = jest.fn();
const mockStorage = {
  from: jest.fn().mockReturnValue({ createSignedUrl: mockCreateSignedUrl }),
};
const mockSupabaseClient = { storage: mockStorage };

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => mockSupabaseClient),
}));

function buildService(overrides: Partial<Record<string, string>> = {}): SupabaseStorageService {
  process.env['SUPABASE_URL'] = overrides['SUPABASE_URL'] ?? 'https://test.supabase.co';
  process.env['SUPABASE_SECRET_KEY'] = overrides['SUPABASE_SECRET_KEY'] ?? 'secret-key';
  process.env['SUPABASE_BUCKET'] = overrides['SUPABASE_BUCKET'] ?? 'test-bucket';

  const service = new SupabaseStorageService();
  service.onModuleInit();
  return service;
}

describe('SupabaseStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env['SUPABASE_URL'];
    delete process.env['SUPABASE_SECRET_KEY'];
    delete process.env['SUPABASE_BUCKET'];
  });

  describe('onModuleInit()', () => {
    it('initialises successfully when all env vars are present', () => {
      expect(() => buildService()).not.toThrow();
    });

    it('throws when SUPABASE_URL is missing', () => {
      process.env['SUPABASE_SECRET_KEY'] = 'key';
      process.env['SUPABASE_BUCKET'] = 'bucket';
      delete process.env['SUPABASE_URL'];

      const service = new SupabaseStorageService();
      expect(() => service.onModuleInit()).toThrow(
        'Fehlende Supabase-Konfiguration',
      );
    });

    it('throws when SUPABASE_SECRET_KEY is missing', () => {
      process.env['SUPABASE_URL'] = 'https://test.supabase.co';
      process.env['SUPABASE_BUCKET'] = 'bucket';
      delete process.env['SUPABASE_SECRET_KEY'];

      const service = new SupabaseStorageService();
      expect(() => service.onModuleInit()).toThrow(
        'Fehlende Supabase-Konfiguration',
      );
    });

    it('throws when SUPABASE_BUCKET is missing', () => {
      process.env['SUPABASE_URL'] = 'https://test.supabase.co';
      process.env['SUPABASE_SECRET_KEY'] = 'key';
      delete process.env['SUPABASE_BUCKET'];

      const service = new SupabaseStorageService();
      expect(() => service.onModuleInit()).toThrow(
        'Fehlende Supabase-Konfiguration',
      );
    });

    it('creates the Supabase client with correct options', () => {
      const { createClient } = jest.requireMock('@supabase/supabase-js');
      buildService({
        SUPABASE_URL: 'https://myproject.supabase.co',
        SUPABASE_SECRET_KEY: 'my-secret',
        SUPABASE_BUCKET: 'my-bucket',
      });

      expect(createClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'my-secret',
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
    });
  });

  describe('createSignedUrl()', () => {
    it('returns the signed URL on success', async () => {
      const service = buildService();
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://cdn.example.com/signed?token=abc' },
        error: null,
      });

      const result = await service.createSignedUrl('path/to/file.pdf', 3600);

      expect(result).toBe('https://cdn.example.com/signed?token=abc');
      expect(mockStorage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('path/to/file.pdf', 3600);
    });

    it('throws InternalServerErrorException when the Supabase call returns an error', async () => {
      const service = buildService();
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Object not found' },
      });

      await expect(service.createSignedUrl('missing/file.pdf', 60)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws InternalServerErrorException when data.signedUrl is missing', async () => {
      const service = buildService();
      mockCreateSignedUrl.mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(service.createSignedUrl('bad/path.pdf', 60)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('includes the error message in the exception', async () => {
      const service = buildService();
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' },
      });

      await expect(service.createSignedUrl('file.pdf', 60)).rejects.toThrow(
        'Bucket not found',
      );
    });
  });
});
