const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter configured for localhost & production cloud environments.
 */
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  let pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  
  // Clean spaces from Google App Password (e.g., 'ukht dajz bndm uxpg' -> 'ukhtdajzbndmuxpg')
  pass = pass.replace(/\s+/g, '');

  const host = (process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com').toLowerCase();

  // If using Gmail or host includes gmail, use Nodemailer's built-in 'gmail' service 
  // which handles SSL (port 465) automatically and avoids Port 587 blockages on cloud servers (Render, AWS, Vercel)
  if (host.includes('gmail') || process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 465;
  const secure = process.env.EMAIL_SECURE !== undefined 
    ? (process.env.EMAIL_SECURE === 'true')
    : (port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Get formatted From header that matches authenticated EMAIL_USER to avoid Gmail 550 rejection
 */
const getFromAddress = (senderLabel = 'Zivora Compliance') => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  if (user) {
    return `"${senderLabel}" <${user}>`;
  }
  return `"${senderLabel}" <no-reply@zivora.com>`;
};

/**
 * Verify transporter connection diagnostic on boot / test
 */
exports.verifySmtpConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully. Ready to send emails.');
    return true;
  } catch (error) {
    console.error('[SMTP] Connection verification failed:', error.message);
    return false;
  }
};

/**
 * Send an OTP code to a user for email verification
 * @param {String} email 
 * @param {String} otp 
 */
exports.sendOtpEmail = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #A48374; border-radius: 12px; background-color: #FBF9F6; color: #3A2D28;">
      <h2 style="color: #3A2D28; text-align: center; letter-spacing: 2px;">ZIVORA Verification Code</h2>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p>Dear Client,</p>
      <p>Thank you for registering with Zivora. Please use the following 6-digit verification code to complete your registration:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background-color: #F1EDE6; padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(164, 131, 116, 0.3); color: #3A2D28;">${otp}</span>
      </div>
      <p style="font-size: 11px; color: #A48374;">This code is valid for 15 minutes. Please do not share this OTP with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p style="font-style: italic; font-size: 11px; text-align: center; color: #A48374;">Thank you for choosing us! We hope you enjoy your experience.</p>
    </div>
  `;

  try {
    console.log(`[MAIL] Dispatching OTP email to ${email}...`);
    const transporter = getTransporter();
    const fromAddress = getFromAddress('Zivora Verification');
    
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Zivora Account Verification Code',
      html: htmlContent
    });
    console.log(`[MAIL] OTP Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAIL] SMTP delivery failed for OTP to ${email}:`, error.message || error);
    throw error;
  }
};

/**
 * Send eKYC processing status updates to a seller or buyer
 * @param {String} email 
 * @param {String} status 'Approved' | 'Rejected'
 * @param {String} name 
 */
exports.sendKycResultEmail = async (email, status, name) => {
  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #A48374; border-radius: 12px; background-color: #FBF9F6; color: #3A2D28;">
      <h2 style="color: #3A2D28; text-align: center; letter-spacing: 1px;">ZIVORA eKYC Status Update</h2>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p>Dear ${name},</p>
      <p>We would like to inform you that your eKYC document submission has been reviewed by our compliance administrators.</p>
      <div style="margin: 25px 0; padding: 15px; border-radius: 8px; border: 1px solid ${status === 'Approved' ? '#10B981' : '#EF4444'}; background-color: ${status === 'Approved' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'}; color: ${status === 'Approved' ? '#10B981' : '#EF4444'}; text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase;">
        Status: ${status}
      </div>
      <p>${status === 'Approved' ? 'Congratulations! Your account is now fully verified. You can now access all direct listing tools and participate in live auctions.' : 'Regrettably, your submission was rejected due to invalid or unreadable proof documents. Please log in to your dashboard and submit a fresh application with clear certificates.'}</p>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p style="font-style: italic; font-size: 11px; text-align: center; color: #A48374;">Thank you for your cooperation.</p>
    </div>
  `;

  try {
    console.log(`[MAIL] Dispatching KYC status email to ${email}: ${status}`);
    const transporter = getTransporter();
    const fromAddress = getFromAddress('Zivora Compliance');

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Zivora eKYC Verification Result',
      html: htmlContent
    });
    console.log(`[MAIL] KYC Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAIL] SMTP delivery failed for KYC result email to ${email}:`, error.message || error);
    throw error;
  }
};

/**
 * Send an OTP code to a user for password reset
 * @param {String} email 
 * @param {String} otp 
 */
exports.sendForgotPasswordOtpEmail = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #A48374; border-radius: 12px; background-color: #FBF9F6; color: #3A2D28;">
      <h2 style="color: #3A2D28; text-align: center; letter-spacing: 2px;">ZIVORA Password Reset</h2>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p>Dear Client,</p>
      <p>We received a request to reset the password for your Zivora account. Please use the following 6-digit verification code to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; background-color: #F1EDE6; padding: 12px 24px; border-radius: 8px; border: 1px solid rgba(164, 131, 116, 0.3); color: #3A2D28;">${otp}</span>
      </div>
      <p style="font-size: 11px; color: #A48374;">This verification code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p style="font-style: italic; font-size: 11px; text-align: center; color: #A48374;">Thank you for choosing Zivora Fine Diamonds.</p>
    </div>
  `;

  try {
    console.log(`[MAIL] Dispatching Forgot Password OTP to ${email}...`);
    const transporter = getTransporter();
    const fromAddress = getFromAddress('Zivora Security');

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: 'Zivora Password Reset Verification Code',
      html: htmlContent
    });
    console.log(`[MAIL] Password Reset Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MAIL] SMTP delivery failed for Password Reset OTP to ${email}:`, error.message || error);
    throw error;
  }
};


