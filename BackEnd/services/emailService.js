const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendWelcomeEmail(toEmail) {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.EMAIL_USER, // must be the Gmail you verified in SendGrid
      name: "Thrive"
    },
    replyTo: process.env.EMAIL_USER, // match from address to reduce spam flags
    subject: "Welcome to Thrive – Your account is ready",
    text: `Hi there,

Welcome to Thrive! Your account has been created successfully.

You can now log in and start exploring.

If you have any questions, just reply to this email.

– The Thrive Team
    `,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>Welcome to Thrive!</h2>
          <p>Your account has been created successfully.</p>
          <p>You can now log in and start exploring.</p>
          <p>If you have any questions, just reply to this email.</p>
          <hr>
          <p style="font-size: 12px; color: #777;">
            Thrive Project • Contact: thriveuser9@gmail.com
          </p>
        </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log("Welcome email sent!");
  } catch (error) {
    console.error("Error sending email:", error.response ? error.response.body : error);
  }
}

// Example usage
module.exports = { sendWelcomeEmail };
