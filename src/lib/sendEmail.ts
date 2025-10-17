import nodemailer from 'nodemailer';

export interface SendEmailOptions {
    to: string;
    cc?: string; // Optional cc field
    subject: string;
    text: string;
    html: string;
}

export async function sendEmail({ to, cc, subject, text, html }: SendEmailOptions): Promise<void> {
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com', // Your SMTP host
        port: Number(process.env.SMTP_PORT) || 587, // Default SMTP port
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || 'notifications@example.com', // Your email address
            pass: process.env.SMTP_PASS || 'your-email-password', // Your email password
        },
    });

    const msg = {
        from: process.env.SMTP_USER || 'notifications@Wow.com', // Provide a default sender if not defined
        to,
        cc,
        subject,
        text,
        html,
    };

    try {
        await transporter.sendMail(msg);
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
