// Sends email through Brevo's HTTPS API. DigitalOcean blocks the normal SMTP
// ports on droplets, so an HTTPS email API is the reliable way to send.
//
// .env:
//   BREVO_API_KEY=xkeysib-...         (Brevo > SMTP & API > API keys)
//   EMAIL_FROM=you@yourdomain.com     (a sender verified in Brevo)
//   EMAIL_FROM_NAME=Impostor
//   APP_URL=https://hammrti.me        (where the links in emails point)
//
// Without BREVO_API_KEY (local development), emails are printed to the
// console instead of sent, so you can click the link from the terminal.

const sent = []; // last emails, used by the tests

const sendEmail = async ({ to, subject, text, html }) => {
    sent.push({ to, subject, text, html });
    if (sent.length > 50) sent.shift();

    if (!process.env.BREVO_API_KEY) {
        if (process.env.NODE_ENV !== 'test') {
            console.log(`\n[email not sent: no BREVO_API_KEY] To: ${to}\nSubject: ${subject}\n${text}\n`);
        }
        return;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || 'Impostor' },
            to: [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Email service error ${response.status}: ${details}`);
    }
};

const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const button = (href, label) =>
    `<p><a href="${href}" style="display:inline-block;padding:12px 20px;background:#e8467c;color:#fff;` +
    `border-radius:10px;text-decoration:none;font-weight:600">${label}</a></p>`;

const sendVerificationEmail = (user, token) => {
    const link = `${appUrl()}/verify?token=${token}`;
    return sendEmail({
        to: user.email,
        subject: 'Verify your Impostor account',
        text: `Hi ${user.firstName}, confirm your email to start playing Impostor:\n${link}\n\nThis link expires in 24 hours.`,
        html: `<p>Hi ${user.firstName},</p><p>Confirm your email to start playing Impostor.</p>` +
            button(link, 'Verify my email') + '<p>This link expires in 24 hours.</p>'
    });
};

const sendPasswordResetEmail = (user, token) => {
    const link = `${appUrl()}/reset-password?token=${token}`;
    return sendEmail({
        to: user.email,
        subject: 'Reset your Impostor password',
        text: `Hi ${user.firstName}, reset your password here:\n${link}\n\nThis link expires in 1 hour. If you didn't ask for this, ignore this email.`,
        html: `<p>Hi ${user.firstName},</p><p>Someone asked to reset your Impostor password.</p>` +
            button(link, 'Choose a new password') +
            "<p>This link expires in 1 hour. If you didn't ask for this, you can ignore this email.</p>"
    });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sent };
