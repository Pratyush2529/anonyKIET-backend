
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  await sgMail.send({
    to,
    from: `"ANONYKIET" <${process.env.SENDGRID_FROM_EMAIL}>`,
    subject,
    html,
  });
};

module.exports = { sendMail };
