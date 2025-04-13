import nodemailer from 'nodemailer';

// Create reusable transporter with Google SMTP credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sends an email using Nodemailer with Google SMTP
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from = process.env.EMAIL } = options;
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: `Firebase Auth App <${from}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gets the base URL for the application
 */
export function getBaseUrl(): string {
  // Priority order for base URL determination:
  // 1. NEXT_PUBLIC_APP_URL - manually set in env vars (most reliable)
  // 2. VERCEL_URL - automatically set by Vercel in production/preview
  // 3. Default to localhost for development
  
  let baseUrl;
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Use the manually configured URL (most reliable option)
    baseUrl = ensureProtocol(process.env.NEXT_PUBLIC_APP_URL);
  } else if (process.env.VERCEL_URL) {
    // Use the Vercel-provided URL with https protocol
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NODE_ENV === 'production') {
    // Fallback for production if nothing else is available
    baseUrl = 'https://firebase-auth-git-main-namokar100s-projects.vercel.app';
  } else {
    // Default for local development
    baseUrl = 'http://localhost:3000';
  }
  
  return baseUrl;
}

/**
 * Ensures a URL has a protocol (http:// or https://)
 */
function ensureProtocol(url: string): string {
  if (!url) return url;
  
  // Check if URL already has a protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Add https:// for production, http:// for development
  return process.env.NODE_ENV === 'production' 
    ? `https://${url}` 
    : `http://${url}`;
}

/**
 * Sends a verification email with custom template
 */
export async function sendVerificationEmailSMTP(
  email: string, 
  token: string, 
  userName: string = '',
  customSubject?: string,
  customHtml?: string
) {
  const subject = customSubject || 'Verify Your Email Address';
  
  // Create verification URL with our custom token
  const baseUrl = getBaseUrl();  
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  // Use custom HTML if provided, otherwise use default verification email template
  const html = customHtml || `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">Email Verification</h2>
      <p>Hello ${userName || email},</p>
      <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>Thanks,<br/>Firebase Auth App Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Sends a password reset email with custom template
 */
export async function sendPasswordResetEmailSMTP(
  email: string,
  token: string,
  userName: string = ''
) {
  const subject = 'Reset Your Password';
  
  // Create password reset URL with the token
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  
  // HTML template for password reset
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">Password Reset</h2>
      <p>Hello ${userName || email},</p>
      <p>We received a request to reset your password. Please click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <p>Thanks,<br/>Firebase Auth App Team</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
  });
} 