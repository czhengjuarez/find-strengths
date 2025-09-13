# Find Your Strengths

A React-based web application that helps users discover and organize their professional strengths through an interactive assessment tool. Users can create personal lists of capabilities, explore community-shared strengths, and rank their skills by enjoyment and proficiency.

## 🌟 Features

### Core Functionality
- **Interactive Strength Assessment**: Step-by-step process to identify and rank personal capabilities
- **Personal "My List"**: Save and manage your own strength assessments (requires authentication)
- **Community Exploration**: Browse and contribute to shared capability categories
- **Dual Ranking System**: Rate capabilities by both enjoyment and skill level
- **Results Analysis**: Get personalized insights based on your rankings

### Authentication System
- **Google OAuth Integration**: Sign in with your Google account
- **Email/Password Authentication**: Traditional login option
- **Guest Mode**: Use the app without signing in (data not persisted)
- **User Profile Management**: Account settings and data management
- **Secure JWT Token System**: Protected API endpoints and user sessions

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Radix UI components
- **Real-time Updates**: Dynamic content loading and state management
- **Intuitive Navigation**: Clean, professional interface design

## 🚀 Live Demo

**Production URL**: [https://find-your-strengths-worker.coscient.workers.dev](https://find-your-strengths-worker.coscient.workers.dev)

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives

### Backend
- **Cloudflare Workers** - Serverless backend platform
- **Hono** - Fast web framework for Workers
- **Cloudflare D1** - SQLite-compatible serverless database
- **JWT Authentication** - Secure token-based auth
- **Google OAuth 2.0** - Social authentication

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Wrangler** - Cloudflare Workers CLI

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Google Cloud Console account (for OAuth setup)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd find-strengths-auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   **🚀 Quick Setup (Recommended):**
   ```bash
   # Run automated setup script
   ./scripts/setup-dev-env.sh
   ```
   
   **📝 Manual Setup:**
   ```bash
   # Copy environment template
   cp .env.example .dev.vars
   # Edit .dev.vars with your actual credentials
   ```

4. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable Google OAuth 2.0 API
   - Create OAuth 2.0 credentials
   - Configure authorized origins: `http://localhost:3000`
   - Configure redirect URIs: `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Secret to your `.dev.vars` file

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

### Production Deployment

The app is configured for deployment on Cloudflare Workers:

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Configure Cloudflare Secrets**
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put JWT_SECRET
   ```

3. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

## 🏗️ Project Structure

```
find-strengths-auth/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── Header.tsx      # App header with auth
│   │   ├── LoginModal.tsx  # Authentication modal
│   │   └── ...
│   ├── contexts/           # React context providers
│   │   └── AuthContext.tsx # Authentication state
│   ├── lib/               # Utility functions
│   └── App.tsx            # Main application component
├── server/                # Legacy Express server (dev only)
├── migrations/           # Database migration files
├── public/              # Static assets
├── wrangler.toml       # Cloudflare Workers config
└── vite.config.ts      # Vite configuration
```

## 🔧 Configuration Details

### Local Development
The local development environment is configured to proxy API calls to the production backend, ensuring consistency between local and production environments.

**Vite Proxy Configuration:**
```typescript
proxy: {
  '/auth': {
    target: 'https://find-your-strengths-worker.coscient.workers.dev',
    changeOrigin: true,
    secure: false,
  },
  '/entries': {
    target: 'https://find-your-strengths-worker.coscient.workers.dev',
    changeOrigin: true,
    secure: false,
  },
  '/community-entries': {
    target: 'https://find-your-strengths-worker.coscient.workers.dev',
    changeOrigin: true,
    secure: false,
  },
}
```

### Database Schema
The application uses the following database tables:
- `users` - User account information
- `user_entries` - Personal capability lists
- `entries` - Community-shared capabilities

## 🔐 Security & Secrets Management

### Security Features
- **JWT Token Authentication** - Secure API access
- **Google OAuth Integration** - Trusted third-party authentication
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Server-side data validation
- **SQL Injection Prevention** - Parameterized queries

### Secrets Management
**🔒 Production Secrets (Cloudflare Workers)**
```bash
# Set production secrets (encrypted & secure)
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET

# Manage secrets
wrangler secret list                    # View all secrets
wrangler secret delete VARIABLE_NAME    # Remove a secret
```

**🛠️ Development Secrets (Local)**
- All secrets stored in `.dev.vars` (gitignored)
- Use setup script: `./scripts/setup-dev-env.sh`
- Template available: `.env.example`
- **Never commit actual secrets to version control**

**🔐 Security Benefits:**
- ✅ Zero secrets in Git repository
- ✅ Encrypted storage (Cloudflare Workers)
- ✅ Environment separation (dev vs production)
- ✅ Team-friendly onboarding process
- ✅ Automatic secret injection in Workers runtime

### Current Deployment Status
**✅ Production Environment:**
- **Worker URL**: `https://find-your-strengths-worker.coscient.workers.dev`
- **Secrets**: All production secrets migrated to Cloudflare Workers encrypted storage
- **Database**: Cloudflare D1 with proper schema and community data
- **Authentication**: Google OAuth fully configured and operational
- **SSL/HTTPS**: Enabled with Cloudflare's edge certificates

**🔧 Latest Updates:**
- **December 2024**: Migrated all secrets from `.dev.vars` to Cloudflare Workers secrets store
- **Security Enhancement**: Removed old/duplicate secrets, implemented enterprise-grade secret management
- **Local Development**: Configured to proxy to production backend for consistent data and behavior

## 🤝 Contributing

### For Team Members

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd find-strengths-auth
   npm install
   ./scripts/setup-dev-env.sh  # Sets up .dev.vars template
   ```

2. **Configure Your Environment**
   
   **🔐 Getting OAuth Credentials (Choose One):**
   
   **Option A: Create Your Own (Recommended)**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project → Enable OAuth 2.0 API → Create credentials
   - Configure: Origins `http://localhost:3000`, Redirect `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Secret to your `.dev.vars`
   
   **Option B: Use Shared Development Credentials**
   - Get credentials from team lead via secure channel (encrypted message/password manager)
   - **Never share credentials via Slack, email, or GitHub**
   
   - Edit `.dev.vars` with your OAuth credentials
   - **Never commit `.dev.vars` - it's gitignored for security**

3. **Development Workflow**
   ```bash
   git checkout -b feature/amazing-feature
   npm run dev                 # Starts on http://localhost:3000
   # Make your changes
   git commit -m 'Add amazing feature'
   git push origin feature/amazing-feature
   ```

4. **Create Pull Request**
   - Open PR against main branch
   - Include description of changes
   - Test authentication flows if touching auth code

### Important Notes for Team
- **Secrets Management**: Use `./scripts/setup-dev-env.sh` for initial setup
- **Local Development**: Connects to production backend automatically
- **OAuth Setup**: Each developer needs their own Google OAuth credentials
- **Database**: Local development uses production D1 database (read-only for most operations)

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation above
- Review the live demo for expected functionality

## 🎯 Roadmap

- [ ] Enhanced analytics and insights
- [ ] Team collaboration features
- [ ] Export functionality for results
- [ ] Mobile app development
- [ ] Integration with professional platforms
