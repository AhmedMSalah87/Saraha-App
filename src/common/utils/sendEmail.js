import { createTransport } from "nodemailer";
import { emailTemaplate } from "./emailTemplate.js";

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
      html: emailTemaplate(otp),
    });

    console.log("message sent: ", info.messageId);
  } catch (error) {
    console.log(error);
  }
};
