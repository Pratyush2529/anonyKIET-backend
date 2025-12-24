const { ipKeyGenerator } = require("express-rate-limit");
const rateLimit  = require("express-rate-limit");

const sendOtpLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 3,                 // 3 OTP requests per window
  keyGenerator: (req)=>{
    const emailId=req.body.emailId;
    return `${ipKeyGenerator(req)}:${emailId}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many OTP requests. Please try again after 2 minutes."
  }
});

module.exports = sendOtpLimiter;
