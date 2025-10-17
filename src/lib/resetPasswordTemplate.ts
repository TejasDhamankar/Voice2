export function createResetPasswordEmailTemplate(username: string, resetLink: string): string {
  const html = `
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div style="background-color: #f0f4f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="padding: 20px; text-align: center;">
                    <img src="https://res.cloudinary.com/dndzbt8al/image/upload/v1724000375/orjojzjia7vfiycfzfly.png" alt="Wow Logo" style="max-width: 150px; height: auto;">
                </div>
                <div style="background: linear-gradient(90deg, #7451F8, #F57E57); color: #ffffff; padding: 20px 40px; font-size: 16px; font-weight: bold; text-align: center; border-radius: 12px; margin: 20px auto; max-width: 80%;">
                    <h1 style="margin: 0; font-size: 20px;">Password Reset Request</h1>
                </div>
                <div style="padding: 20px;">
                    <p><strong>Dear ${username},</strong></p>
                    <p>We have received a request to reset your password for your Wow account. To complete the process, please click the button below:</p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${resetLink}" style="background-color: #0C874B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    </div>
                    <div style="border-radius:8px; margin-top:20px; color:#000000; padding:10px; background-color:#ECF1F6">
                        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
                        <p>This password reset link will expire in 30 minutes.</p>
                    </div>
                    <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #888888;">This is an automated message. Please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
  `;

  return html;
}
