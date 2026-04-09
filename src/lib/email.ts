import { z } from 'zod';

const emailConfigSchema = z.object({
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@dealscope.fr'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

type EmailConfig = z.infer<typeof emailConfigSchema>;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ResetPasswordParams {
  email: string;
  resetToken: string;
  firstName?: string;
}

interface WelcomeEmailParams {
  email: string;
  firstName: string;
}

function getConfig(): EmailConfig {
  return emailConfigSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@dealscope.fr',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  });
}

async function sendWithResend(params: SendEmailParams, config: EmailConfig): Promise<boolean> {
  if (!config.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Resend API error:', error);
      return false;
    }

    console.log('[Email] Email sent successfully via Resend to:', params.to);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send via Resend:', error);
    return false;
  }
}

async function sendWithSMTP(params: SendEmailParams, config: EmailConfig): Promise<boolean> {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    console.warn('[Email] SMTP not fully configured');
    return false;
  }

  console.log('[Email] SMTP sending not implemented - use nodemailer in production');
  return false;
}

async function sendWithConsole(params: SendEmailParams, config: EmailConfig): Promise<boolean> {
  console.log('\n========== EMAIL (DEV MODE) ==========');
  console.log('To:', params.to);
  console.log('Subject:', params.subject);
  console.log('--------------------------------------');
  console.log(params.text || params.html.replace(/<[^>]*>/g, ''));
  console.log('========================================\n');
  return true;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const config = getConfig();

  if (config.RESEND_API_KEY) {
    return sendWithResend(params, config);
  }

  if (config.SMTP_HOST) {
    return sendWithSMTP(params, config);
  }

  if (process.env.NODE_ENV === 'development') {
    return sendWithConsole(params, config);
  }

  console.error('[Email] No email provider configured');
  return false;
}

export async function sendResetPasswordEmail(params: ResetPasswordParams): Promise<boolean> {
  const config = getConfig();
  const resetUrl = `${config.NEXT_PUBLIC_APP_URL}/reset-password?token=${params.resetToken}`;
  const firstName = params.firstName || 'Utilisateur';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Réinitialisation de votre mot de passe</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">DealScope</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Bonjour ${firstName},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe pour votre compte DealScope.
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
Bonjour ${firstName},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte DealScope.

Cliquez sur ce lien pour réinitialiser votre mot de passe :
${resetUrl}

Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.
  `.trim();

  return sendEmail({
    to: params.email,
    subject: 'Réinitialisation de votre mot de passe - DealScope',
    html,
    text,
  });
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const config = getConfig();
  const loginUrl = `${config.NEXT_PUBLIC_APP_URL}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Bienvenue sur DealScope</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">DealScope</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Bienvenue ${params.firstName} !</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Votre compte DealScope a été créé avec succès. Vous pouvez maintenant accéder à votre espace M&A.
        </p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Accéder à mon compte
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
Bienvenue ${params.firstName} !

Votre compte DealScope a été créé avec succès.

Connectez-vous ici : ${loginUrl}
  `.trim();

  return sendEmail({
    to: params.email,
    subject: 'Bienvenue sur DealScope',
    html,
    text,
  });
}

export function isEmailConfigured(): boolean {
  const config = getConfig();
  return !!(config.RESEND_API_KEY || config.SMTP_HOST || process.env.NODE_ENV === 'development');
}
