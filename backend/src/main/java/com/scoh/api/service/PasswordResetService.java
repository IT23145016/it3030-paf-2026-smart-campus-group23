package com.scoh.api.service;

import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.UserAccountRepository;
import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

    private static final long OTP_EXPIRY_SECONDS = 300;

    private record OtpEntry(String otp, Instant expiresAt) {}

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    public PasswordResetService(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            JavaMailSender mailSender) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    public void sendOtp(String email) {
        userAccountRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new NotFoundException("No account found for this email."));

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email.trim().toLowerCase(), new OtpEntry(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS)));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email.trim());
        message.setSubject("Smart Uni Hub — Password Reset OTP");
        message.setText("Your OTP for password reset is: " + otp + "\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore this email.");
        mailSender.send(message);
    }

    public void resetPassword(String email, String otp, String newPassword) {
        String key = email.trim().toLowerCase();
        OtpEntry entry = otpStore.get(key);

        if (entry == null) {
            throw new ForbiddenOperationException("No OTP was requested for this email.");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(key);
            throw new ForbiddenOperationException("OTP has expired. Please request a new one.");
        }
        if (!entry.otp().equals(otp.trim())) {
            throw new ForbiddenOperationException("Invalid OTP. Please try again.");
        }

        var user = userAccountRepository.findByEmailIgnoreCase(key)
                .orElseThrow(() -> new NotFoundException("No account found for this email."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userAccountRepository.save(user);
        otpStore.remove(key);
    }
}
