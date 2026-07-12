import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { IEmailService } from '@iranianoralhistory/backend-identity-domain';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly resend = new Resend(process.env['RESEND_API_KEY'] ?? '');
  private readonly fromAddress = process.env['RESEND_FROM_ADDRESS'] ?? 'onboarding@resend.dev';

  async sendPasswordResetCode(to: string, code: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject: 'RAIOH – Passwort zurücksetzen',
      html: this.buildHtml(code),
    });

    if (error) {
      this.logger.error(`Failed to send reset email to ${to}: ${JSON.stringify(error)}`);
      throw new Error('E-Mail konnte nicht gesendet werden.');
    }
  }

  private buildHtml(code: string): string {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Passwort zurücksetzen – RAIOH</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <!-- Header -->
          <tr>
            <td style="background:#7F0000;border-radius:8px 8px 0 0;padding:28px 32px;text-align:center;">
              <span style="font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:0.14em;">RAIOH</span>
              <p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:6px 0 0;letter-spacing:0.04em;">
                Forschungsverein für Iranische Oral History
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:32px;border-left:1px solid rgba(127,0,0,0.1);border-right:1px solid rgba(127,0,0,0.1);">
              <h1 style="font-size:1.25rem;font-weight:600;color:#1a1a1a;margin:0 0 12px;">
                Passwort zurücksetzen
              </h1>
              <p style="color:#555;font-size:0.9375rem;line-height:1.6;margin:0 0 24px;">
                Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.
                Bitte geben Sie den folgenden Code ein. Er ist <strong>10 Minuten</strong> gültig.
              </p>

              <!-- Code box -->
              <div style="background:#fafafa;border:1.5px dashed rgba(127,0,0,0.3);border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
                <span style="font-size:2.25rem;font-weight:700;letter-spacing:0.35em;color:#7F0000;font-family:'Courier New',monospace;">
                  ${code}
                </span>
              </div>

              <p style="color:#888;font-size:0.8125rem;line-height:1.5;margin:0;">
                Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
                Ihr Passwort bleibt unverändert.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0;border:1px solid rgba(127,0,0,0.08);border-top:none;border-radius:0 0 8px 8px;padding:16px 32px;text-align:center;">
              <p style="color:#aaa;font-size:0.75rem;margin:0;">
                © ${new Date().getFullYear()} RAIOH · Berlin · Automatisch generierte E-Mail, bitte nicht antworten.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
