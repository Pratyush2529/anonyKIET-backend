import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendOtpEmail = async (to, otp) => {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: "Your anonyKIET Login Code",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });
};

export const sendMail = async ({ to, subject, html }) => {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
  });
};