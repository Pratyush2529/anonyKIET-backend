const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: `"ANONYKIET" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", data.id);
    return data;
  } catch (error) {
    console.error("Mail error:", error);
    throw error;
  }
};

module.exports = { sendMail };
