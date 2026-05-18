const nodemailer = require('nodemailer');

// ============================================================
// 📧 EMAIL UTILITY - Powered by Gmail SMTP (via Nodemailer)
// ============================================================

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,   // 10 giây để kết nối
    greetingTimeout: 10000,     // 10 giây chờ server greeting
    socketTimeout: 15000,       // 15 giây mỗi thao tác socket
});

const FROM_ADDRESS = `"Phủi Score 🏆" <${process.env.SMTP_USER}>`;

/**
 * Gửi OTP Xác minh Email khi đăng ký tài khoản mới
 * @param {string} toEmail - Địa chỉ email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} fullName - Tên hiển thị của người dùng
 */
async function sendVerificationOtp(toEmail, otp, fullName = 'bạn') {
    const mailOptions = {
        from: FROM_ADDRESS,
        to: toEmail,
        subject: `[Phủi Score] Mã xác minh tài khoản của bạn`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">⚽ Phủi Score</h1>
                <p style="color: #6c757d; font-size: 14px;">Nền tảng bóng đá phủi hàng đầu</p>
            </div>
            <div style="background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">Xin chào, ${fullName}! 👋</h2>
                <p style="color: #495057; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại Phủi Score. Vui lòng sử dụng mã OTP bên dưới để xác minh địa chỉ email của bạn:</p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #e63946, #c62a35); color: #ffffff; font-size: 40px; font-weight: 800; letter-spacing: 12px; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 16px rgba(230,57,70,0.4);">
                        ${otp}
                    </div>
                </div>
                <p style="color: #6c757d; font-size: 13px; text-align: center; margin-bottom: 0;">⏱️ Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            </div>
            <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 20px;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
        </div>
        `,
    };
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: Gửi email mất quá 15 giây')), 15000)
    );
    await Promise.race([transporter.sendMail(mailOptions), timeout]);
    console.log(`[Email] ✅ Đã gửi OTP xác minh đến: ${toEmail}`);
}

/**
 * Gửi OTP Khôi phục mật khẩu
 * @param {string} toEmail - Địa chỉ email người nhận
 * @param {string} otp - Mã OTP 6 chữ số
 * @param {string} fullName - Tên hiển thị của người dùng
 */
async function sendPasswordResetOtp(toEmail, otp, fullName = 'bạn') {
    const mailOptions = {
        from: FROM_ADDRESS,
        to: toEmail,
        subject: `[Phủi Score] Mã khôi phục mật khẩu`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">⚽ Phủi Score</h1>
                <p style="color: #6c757d; font-size: 14px;">Nền tảng bóng đá phủi hàng đầu</p>
            </div>
            <div style="background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <h2 style="color: #1a1a2e; font-size: 20px; margin-top: 0;">Yêu cầu đặt lại mật khẩu 🔐</h2>
                <p style="color: #495057; line-height: 1.6;">Xin chào <strong>${fullName}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã OTP bên dưới để tiến hành đặt lại mật khẩu:</p>
                <div style="text-align: center; margin: 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #f4a261, #e76f51); color: #ffffff; font-size: 40px; font-weight: 800; letter-spacing: 12px; padding: 16px 32px; border-radius: 12px; box-shadow: 0 4px 16px rgba(231,111,81,0.4);">
                        ${otp}
                    </div>
                </div>
                <p style="color: #6c757d; font-size: 13px; text-align: center; margin-bottom: 0;">⏱️ Mã có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            </div>
            <p style="color: #adb5bd; font-size: 12px; text-align: center; margin-top: 20px;">Nếu bạn không thực hiện yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
        </div>
        `,
    };
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: Gửi email mất quá 15 giây')), 15000)
    );
    await Promise.race([transporter.sendMail(mailOptions), timeout]);
    console.log(`[Email] ✅ Đã gửi OTP khôi phục mật khẩu đến: ${toEmail}`);
}

module.exports = { sendVerificationOtp, sendPasswordResetOtp };
