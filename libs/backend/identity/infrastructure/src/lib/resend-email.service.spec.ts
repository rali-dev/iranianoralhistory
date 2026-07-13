import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service';

const fakeConfig = {
  get: (k: string) => process.env[k],
  getOrThrow: (k: string) => {
    const v = process.env[k];
    if (v === undefined) throw new Error(`Missing ${k}`);
    return v;
  },
} as unknown as ConfigService;

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('ResendEmailService', () => {
  let service: ResendEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env['RESEND_API_KEY'] = 'test-api-key';
    process.env['RESEND_FROM_ADDRESS'] = 'no-reply@raioh.de';
    service = new ResendEmailService(fakeConfig);
  });

  describe('constructor', () => {
    it('throws when RESEND_API_KEY is missing', () => {
      delete process.env['RESEND_API_KEY'];

      expect(() => new ResendEmailService(fakeConfig)).toThrow('Missing RESEND_API_KEY');
    });
  });

  describe('sendPasswordResetCode()', () => {
    it('calls resend.emails.send with the correct recipient and subject', async () => {
      mockSend.mockResolvedValue({ data: {}, error: null });

      await service.sendPasswordResetCode('user@example.de', '123456');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.de',
          subject: 'RAIOH – Passwort zurücksetzen',
        }),
      );
    });

    it('uses the configured from address', async () => {
      mockSend.mockResolvedValue({ data: {}, error: null });

      await service.sendPasswordResetCode('user@example.de', '123456');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'no-reply@raioh.de' }),
      );
    });

    it('falls back to the default from address when RESEND_FROM_ADDRESS is unset', async () => {
      delete process.env['RESEND_FROM_ADDRESS'];
      service = new ResendEmailService(fakeConfig);
      mockSend.mockResolvedValue({ data: {}, error: null });

      await service.sendPasswordResetCode('user@example.de', '123456');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'onboarding@resend.dev' }),
      );
    });

    it('includes the reset code in the HTML body', async () => {
      mockSend.mockResolvedValue({ data: {}, error: null });

      await service.sendPasswordResetCode('user@example.de', '654321');

      const { html } = mockSend.mock.calls[0][0];
      expect(html).toContain('654321');
    });

    it('throws when resend returns an error object', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });

      await expect(
        service.sendPasswordResetCode('user@example.de', '111111'),
      ).rejects.toThrow('E-Mail konnte nicht gesendet werden.');
    });

    it('does not throw when resend returns no error', async () => {
      mockSend.mockResolvedValue({ data: {}, error: null });

      await expect(
        service.sendPasswordResetCode('user@example.de', '999999'),
      ).resolves.not.toThrow();
    });
  });
});
