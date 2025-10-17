export function createCallFailureEmailTemplate(
  userName: string,
  callDetails: {
    contactName: string;
    phoneNumber: string;
    failureReason: string;
    agentName?: string;
    timestamp: string;
    callId?: string;
  }
): string {
  const html = `
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <div style="background-color: #f0f4f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="padding: 20px; text-align: center;">
                    <img src="https://res.cloudinary.com/dndzbt8al/image/upload/v1724000375/orjojzjia7vfiycfzfly.png" alt="Wow Logo" style="max-width: 150px; height: auto;">
                </div>
                <div style="background: linear-gradient(90deg, #7451F8, #F57E57); color: #ffffff; padding: 20px 40px; font-size: 16px; font-weight: bold; text-align: center; border-radius: 12px; margin: 20px auto; max-width: 80%;">
                    <h1 style="margin: 0; font-size: 20px;">Call Failed</h1>
                </div>
                <div style="padding: 20px;">
                    <p><strong>Dear ${userName},</strong></p>
                    <p>We regret to inform you that a call initiated from your Wow account has failed.</p>
                    <div style="border-radius:8px; margin-top:4px; color:#000000; padding:10px; background-color:#ECF1F6">
                        <p><strong>Contact Name:</strong> ${callDetails.contactName}</p>
                        <p><strong>Phone Number:</strong> ${callDetails.phoneNumber}</p>
                        ${callDetails.agentName ? `<p><strong>Agent:</strong> ${callDetails.agentName}</p>` : ''}
                        <p><strong>Time:</strong> ${callDetails.timestamp}</p>
                        <p><strong>Reason for Failure:</strong> ${callDetails.failureReason}</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        ${callDetails.callId ?
                          `<a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/calls/${callDetails.callId}" style="background-color: #0C874B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Call Details</a>` :
                          `<a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/calls" style="background-color: #0C874B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Calls Dashboard</a>`
                        }
                    </div>
                    <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #888888;">This is an automated notification. Please do not reply.</p>
                </div>
            </div>
        </div>
    </body>
  `;

  return html;
}
