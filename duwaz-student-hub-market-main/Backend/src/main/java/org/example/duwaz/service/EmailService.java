package org.example.duwaz.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends the delivery OTP to the customer's email address.
     * Runs asynchronously so it never blocks the HTTP response.
     */
    @Async
    public void sendOtpEmail(String toEmail, String customerName,
                              String otpCode, Long orderId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject("Your Delivery OTP — Order #" + orderId);

            String html = """
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
                      <h2 style="color:#7c3f2a;margin-bottom:4px;">Duwaz</h2>
                      <p style="color:#6b7280;font-size:14px;margin-top:0;">Student Hub Market</p>
                      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                      <p style="font-size:16px;">Hi <strong>%s</strong>,</p>
                      <p style="font-size:15px;color:#374151;">
                        Your order <strong>#%d</strong> is arriving now!
                        Give the code below to your driver to confirm delivery:
                      </p>
                      <div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
                        <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;letter-spacing:1px;">DELIVERY OTP</p>
                        <p style="margin:8px 0 0;font-size:42px;font-weight:900;letter-spacing:10px;color:#7c3f2a;font-family:monospace;">%s</p>
                      </div>
                      <p style="font-size:13px;color:#9ca3af;">
                        This code is valid for this delivery only. Do not share it with anyone except your driver.
                      </p>
                      <p style="font-size:13px;color:#9ca3af;margin-bottom:0;">— The Duwaz Team</p>
                    </div>
                    """.formatted(customerName, orderId, otpCode);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            // Log but never throw — email failure must not break the delivery assignment
            System.err.println("[EmailService] Failed to send OTP email to " + toEmail + ": " + e.getMessage());
        }
    }
}
