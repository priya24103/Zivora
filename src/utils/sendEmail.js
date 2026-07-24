const nodemailer = require('nodemailer');

// Configure Transporter with ethereal SMTP fallbacks for testing
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587,
  secure: (process.env.EMAIL_SECURE || process.env.SMTP_SECURE) === 'true',
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'ethereal_password'
  }
});

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
    // Log to console as a developer fail-safe
    console.log(`[MAIL MOCK] Sending OTP to ${email}: ${otp}`);
    
    await transporter.sendMail({
      from: `"Zivora Compliance" <${process.env.EMAIL_USER || process.env.SMTP_USER || 'compliance@zivora.com'}>`,
      to: email,
      subject: 'Zivora Account Verification Code',
      html: htmlContent
    });
  } catch (error) {
    console.error(`SMTP delivery failed, but OTP logged to console: ${otp}`);
  }
};

/**
 * Send eKYC processing status updates to a seller
 * @param {String} email 
 * @param {String} status 'Approved' | 'Rejected'
 * @param {String} name 
 */
exports.sendKycResultEmail = async (email, status, name) => {
  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #A48374; border-radius: 12px; background-color: #FBF9F6; color: #3A2D28;">
      <h2 style="color: #3A2D28; text-align: center; letter-spacing: 1px;">ZIVORA eKYC Status Update</h2>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p>Dear Seller ${name},</p>
      <p>We would like to inform you that your eKYC document submission has been reviewed by our compliance administrators.</p>
      <div style="margin: 25px 0; padding: 15px; border-radius: 8px; border: 1px solid ${status === 'Approved' ? '#10B981' : '#EF4444'}; background-color: ${status === 'Approved' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)'}; color: ${status === 'Approved' ? '#10B981' : '#EF4444'}; text-align: center; font-weight: bold; font-size: 18px; text-transform: uppercase;">
        Status: ${status}
      </div>
      <p>${status === 'Approved' ? 'Congratulations! Your premium seller account is now fully verified. You can now access all direct listing tools and participate in live auctions.' : 'Regrettably, your submission was rejected due to invalid or unreadable proof documents. Please log in to your dashboard and submit a fresh application with clear certificates.'}</p>
      <hr style="border: 0; border-top: 1px solid #A48374; margin: 20px 0;">
      <p style="font-style: italic; font-size: 11px; text-align: center; color: #A48374;">Thank you for your cooperation.</p>
    </div>
  `;

  try {
    console.log(`[MAIL MOCK] Sending KYC status to ${email}: ${status}`);
    
    await transporter.sendMail({
      from: `"Zivora Compliance" <${process.env.EMAIL_USER || process.env.SMTP_USER || 'compliance@zivora.com'}>`,
      to: email,
      subject: 'Zivora eKYC Verification Result',
      html: htmlContent
    });
  } catch (error) {
    console.error(`SMTP delivery failed for KYC result email.`);
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
    console.log(`[MAIL MOCK] Sending Forgot Password OTP to ${email}: ${otp}`);
    
    await transporter.sendMail({
      from: `"Zivora Security" <${process.env.EMAIL_USER || process.env.SMTP_USER || 'security@zivora.com'}>`,
      to: email,
      subject: 'Zivora Password Reset Verification Code',
      html: htmlContent
    });
  } catch (error) {
    console.error(`SMTP delivery failed, but Password Reset OTP logged to console: ${otp}`);
  }
};

