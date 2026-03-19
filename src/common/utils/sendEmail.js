import { createTransport } from "nodemailer";

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmailVerification = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `Design Co. ${process.env.SMTP_USER}`,
      to: email,
      subject: "Email Verification OTP",
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code:</p>
        <h1>${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    console.log("message sent: ", info.messageId);
  } catch (error) {
    console.log(error);
  }
};
