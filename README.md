# Hackoverflow Admin Dashboard

<div align="center">

**Unified event management dashboard for Hackoverflow 4.0**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

[Features](#features) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Security](#security-features)

</div>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Security Features](#security-features)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Features

### Bulk Email Mailer
- Send personalized emails to participants
- Rich text editor with template support
- Track email delivery status
- Group selection and filtering
- Email campaign analytics

### ID Card Generator
- Generate print-ready badges for all participants
- Customizable templates with QR codes
- Bulk PDF generation
- Team-based grouping
- Export options for printing

### Participant Management
- Complete CRUD operations for attendees
- CSV import/export functionality
- Check-in tracking (College & Lab)
- Team management
- Search and filter capabilities

### Sponsor Management
- Manage event sponsors and partners
- Tier-based categorization
- Logo and link management
- Visibility controls

### Check-in System
- Real-time attendance tracking
- College check-in
- Lab check-in
- QR code scanning support
- Attendance reports

### Analytics Dashboard
- Live event statistics
- Check-in percentages
- Team formation tracking
- Email campaign metrics
- Visual data representation

### Enterprise-Grade Security
- JWT-based authentication
- Rate limiting (3 login attempts/min)
- Zod schema validation
- CSRF protection
- Security headers (XSS, Clickjacking prevention)
- Account status verification
- Audit logging

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS
- **UI Components:** Custom React components
- **PDF Generation:** jsPDF
- **QR Codes:** qrcode library

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Database:** MongoDB with native driver
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **Email:** Nodemailer with Gmail
- **Password Hashing:** bcryptjs

### Security
- Rate limiting with sliding window algorithm
- Input validation and sanitization
- Security headers (helmet-style)
- HTTP-only cookies
- Environment-based secrets

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Gmail account for email sending

### Installation

1. **Clone the repository
   ```bash
   git clone https://github.com/yourusername/hackoverflow-dashboard.git
   cd hackoverflow-dashboard
   ```

2. **Install dependencies
   ```bash
   npm install
   ```

3. **Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/hackoverflow
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hackoverflow

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this

   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Create an admin user
   ```bash
   npm run create-admin
   ```
   
   Follow the prompts to create your first admin account.

5. **Run the development server
   ```bash
   npm run dev
   ```

6. **Open your browser
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
hackoverflow-dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── login/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   └── dashboard/
│   │       ├── checkin/          # Check-in management
│   │       ├── id-cards/         # Badge generation
│   │       ├── mailer/           # Email campaigns
│   │       ├── participants/     # Attendee management
│   │       └── sponsors/         # Sponsor management
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── email/                # Email sending
│   │   ├── participants/         # Participant CRUD
│   │   └── sponsors/             # Sponsor CRUD
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── actions/                      # Server actions
│   ├── auth.ts                   # Auth actions
│   ├── email.ts                  # Email actions
│   ├── participants.ts           # Participant actions
│   └── sponsors.ts               # Sponsor actions
│
├── components/                   # React components
│   ├── id-card/                  # ID card components
│   ├── mailer/                   # Email editor components
│   └── Sidebar.tsx               # Dashboard navigation
│
├── lib/                          # Utility libraries
│   ├── api-response.ts           # Standardized API responses
│   ├── auth.ts                   # JWT utilities
│   ├── email.ts                  # Email service
│   ├── mongodb.ts                # Database connection
│   ├── rate-limiter.ts           # Rate limiting
│   └── validation.ts             # Zod schemas
│
├── utils/                        # Helper functions
│   ├── csv-download.ts           # CSV export
│   ├── generate-pdf.ts           # PDF generation
│   └── generate-qr.ts            # QR code generation
│
├── types/                        # TypeScript types
│   └── index.ts                  # Shared types
│
├── scripts/                      # Utility scripts
│   └── create-admin.ts           # Admin creation script
│
├── docs/                         # Documentation
│   └── SECURITY_UPGRADE.md       # Security documentation
│
├── .env.local                    # Environment variables (gitignored)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
└── tsconfig.json                 # TypeScript config
```

---

## API Routes

### Authentication

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/auth/login` | Login with email/password | 3/min |
| `POST` | `/api/auth/logout` | Logout and clear session | 5/min |
| `GET` | `/api/auth/session` | Check session validity | 200/min |

### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/participants` | List all participants |
| `POST` | `/api/participants` | Create new participant |
| `PUT` | `/api/participants/[id]` | Update participant |
| `DELETE` | `/api/participants/[id]` | Delete participant |
| `POST` | `/api/participants/import` | Bulk import from CSV |

### Sponsors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sponsors` | List all sponsors |
| `POST` | `/api/sponsors` | Create new sponsor |
| `PUT` | `/api/sponsors/[id]` | Update sponsor |
| `DELETE` | `/api/sponsors/[id]` | Delete sponsor |

### Email

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/email/send` | Send bulk emails |
| `GET` | `/api/email/analytics` | Email campaign stats |

---

## Security Features

The dashboard implements enterprise-grade security measures:

### 1. **Authentication & Authorization
- JWT-based stateless authentication
- HTTP-only cookies for token storage
- 7-day token expiration
- Session verification with database check
- Account status verification

### 2. **Rate Limiting
- Sliding window algorithm
- Per-client tracking via IP
- Configurable limits per endpoint
- Rate limit headers in responses

```typescript
// Example: Login limited to 3 attempts per minute
POST /api/auth/login
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1738800000
```

### 3. **Input Validation
- Zod schema validation
- Email format verification
- Length constraints
- Input sanitization (trim, lowercase)

### 4. **Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-store, no-cache, must-revalidate
```

### 5. **Protection Against Attacks
-  Brute force (rate limiting)
-  Credential stuffing (rate limiting + consistent errors)
-  Timing attacks (consistent response times)
-  Email enumeration (same error for invalid email/password)
-  XSS (headers + sanitization)
-  Clickjacking (X-Frame-Options)
-  CSRF (SameSite cookies)

### 6. **Audit Logging
- Login/logout events logged
- Last login timestamp tracking
- Error logging with sanitized data

For detailed security documentation, see [SECURITY_UPGRADE.md](docs/SECURITY_UPGRADE.md)

---

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# ===================================
# DATABASE
# ===================================
MONGODB_URI=mongodb://localhost:27017/hackoverflow

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hackoverflow?retryWrites=true&w=majority

# ===================================
# AUTHENTICATION
# ===================================
# Generate a secure random string (min 32 characters)
# Example: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# ===================================
# EMAIL SERVICE
# ===================================
EMAIL_USER=your-gmail@gmail.com
# For Gmail: Use App Password (not your account password)
# Generate at: https://myaccount.google.com/apppasswords
EMAIL_PASSWORD=your-16-digit-app-password

# Email sender details
EMAIL_FROM_NAME=Hackoverflow Team
EMAIL_FROM_ADDRESS=noreply@hackoverflow.com

# ===================================
# APPLICATION
# ===================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ===================================
# OPTIONAL: RATE LIMITING
# ===================================
# Override default rate limits (requests per window)
# RATE_LIMIT_LOGIN=3
# RATE_LIMIT_AUTH=5
# RATE_LIMIT_API=100
```

### Important Notes:
- **Never commit `.env.local` to git** (already in `.gitignore`)
- Use strong, random values for `JWT_SECRET`
- For Gmail, enable 2FA and create an App Password
- For production, use environment-specific secrets

---

## Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Utilities
npm run create-admin # Create admin user interactively
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Database
npm run seed         # (If implemented) Seed database with sample data
```

---

## Documentation

### Core Documentation
- [Security Upgrade Guide](docs/SECURITY_UPGRADE.md) - Detailed security implementation
- [Migration Guide](MIGRATION.md) - Upgrading from older versions
- [API Reference](docs/API.md) - Complete API documentation (if available)

### Additional Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Zod Validation](https://zod.dev/)

---

## Key Features in Detail

### Bulk Email System
```typescript
// Send personalized emails to selected participants
const response = await fetch('/api/email/send', {
  method: 'POST',
  body: JSON.stringify({
    recipients: ['user1@example.com', 'user2@example.com'],
    subject: 'Welcome to Hackoverflow 4.0!',
    htmlContent: '<h1>Hello {{name}}</h1>',
    variables: { eventDate: '2024-03-15' }
  })
});
```

### ID Card Generation
- Generates professional badges with QR codes
- Supports batch PDF export
- Customizable templates
- Team information included
- Print-ready A4 layout (8 cards per page)

### CSV Import
```csv
name,email,college,year,branch,phone,teamName
John Doe,john@example.com,MIT,3,CSE,1234567890,Team Alpha
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add TypeScript types for all new code
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## Troubleshooting

### Common Issues

**MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Email Sending Fails
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution:** 
1. Enable 2FA on Gmail
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use the 16-digit app password in `EMAIL_PASSWORD`

**Rate Limit Errors During Testing**
**Solution:** Temporarily increase limits in `lib/rate-limiter.ts` or wait for the window to reset

---

<div align="center">

**Made with care for Hackoverflow 4.0**

Star this repo if you find it helpful!

</div>