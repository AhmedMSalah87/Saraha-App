💬 Saraha App - Backend

A secure and scalable backend for an anonymous messaging platform, inspired by Saraha. Users can register, verify email via OTP, login, reset passwords, and receive anonymous messages.

This project demonstrates real-world backend development skills, including authentication, JWT-based sessions, email verification, file uploads, Redis caching, and rate-limiting.

📌 Project Overview
User registration with email verification via OTP
Authentication & Authorization with JWT (access + refresh tokens)
Profile management: view profiles, update info, change password
Anonymous messaging system
Photo uploads: profile avatar + gallery
Security features: rate limiting, hashed passwords, token revocation
Caching & temporary storage: Redis for OTPs and resend attempts

⚙️ Tech Stack
Node.js + Express.js
MongoDB with Mongoose
Redis for OTPs, cooldowns, and blocking
JWT for access and refresh tokens
Cloudinary for file uploads
Rate limiting: email-based, IP-based, and file uploads
Email service: OTP verification & password reset
