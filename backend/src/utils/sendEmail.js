const nodemailer = require('nodemailer');
const dns = require('dns').promises;

/**
 * Send email using Nodemailer SMTP, pre-resolved to IPv4 to avoid ENETUNREACH
 * on hosts (like Render) that lack outbound IPv6 connectivity.
 * @param {Object} options - Email parameters { email, subject, message, html }
 */
const sendEmail = async (options) => {
  const smtpUser = process.env.SMTP_USER;
  const isDevMode = !smtpUser || smtpUser === 'your_email@gmail.com';
  if (isDevMode) {
    console.log(`[DEVELOPMENT MODE] Email notification queued for ${options.email}:`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    return;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  // Resolve strictly to IPv4 — connecting to a bare hostname lets Node's dual-stack
  // resolver pick an IPv6 address, which is unreachable on Render and throws ENETUNREACH.
  let resolvedIp;
  try {
    const lookupRes = await dns.lookup(host, { family: 4 });
    resolvedIp = lookupRes.address;
  } catch (dnsErr) {
    throw new Error(`Could not resolve IPv4 address for ${host}: ${dnsErr.message}`);
  }

  const transporter = nodemailer.createTransport({
    host: resolvedIp,
    port: port,
    secure: secure,
    tls: {
      servername: host, // required for correct TLS cert validation since `host` is now a raw IP
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromName = process.env.FROM_NAME || process.env.SMTP_FROM || 'ThinkDifferent LMS';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<p>${(options.message || '').replace(/\n/g, '<br>')}</p>`,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } finally {
    transporter.close();
  }
};

module.exports = sendEmail;
