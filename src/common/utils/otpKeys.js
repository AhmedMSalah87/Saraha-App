const otpPrefix = "otp";

export const otpKeys = {
  otp: (email) => `${otpPrefix}:${email}`,
  cooldown: (email) => `${otpPrefix}:${email}:cooldown`,
  resendAttempts: (email) => `${otpPrefix}:${email}:resend_attempts`,
  verifyAttempts: (email) => `${otpPrefix}:${email}:verify_attempts`,
  block: (email) => `${otpPrefix}:${email}:blocked`,
};
