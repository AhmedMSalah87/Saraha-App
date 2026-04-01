export const emailTemaplate = (otp) => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        text-align: center;
      }
      .logo {
        font-size: 22px;
        font-weight: bold;
        color: #333;
        margin-bottom: 20px;
      }
      .title {
        font-size: 20px;
        color: #333;
        margin-bottom: 10px;
      }
      .text {
        font-size: 14px;
        color: #666;
        margin-bottom: 20px;
      }
      .otp {
        font-size: 28px;
        font-weight: bold;
        color: #2d89ff;
        letter-spacing: 4px;
        margin: 20px 0;
      }
      .footer {
        font-size: 12px;
        color: #aaa;
        margin-top: 30px;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="logo">Your App</div>

      <div class="title">Verify Your Email</div>

      <div class="text">
        Use the OTP below to complete your verification. This code is valid for 10 minutes.
      </div>

      <div class="otp">${otp}</div>

      <div class="text">
        If you didn’t request this, you can safely ignore this email.
      </div>

      <div class="footer">
        © 2026 Your App. All rights reserved.
      </div>
    </div>
  </body>
</html>`;
};
