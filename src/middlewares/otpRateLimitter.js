import rateLimit from "express-rate-limit";

export const sendOtpLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3,                 // 3 OTP requests per window
  keyGenerator: (req) => req.body.emailId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests. Please try again after 2 minutes."
  }
});
