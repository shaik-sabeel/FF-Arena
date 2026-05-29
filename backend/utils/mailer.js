const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n======================================================
[MOCK EMAIL DISPATCH LOG]
------------------------------------------------------
To:      ${to}
Subject: ${subject}
Content: ${text}
======================================================\n`);
    return { mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"BL Battle Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Dispatch] Sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Dispatch] Failed to send email:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendEmail;
