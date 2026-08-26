import * as dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

interface IGmailConfig {
  user: string
  password: string
}

type EmailTransport = 'gmail' | 'json'

interface IAppConfig {
  name: string
  url: string
  corsOrigin: string[]
}

class Config {
  get gmailConfig(): IGmailConfig {
    return {
      user: process.env.GMAIL_USER || '',
      password: process.env.GMAIL_PASSWORD || '',
    }
  }

  /**
   * Which nodemailer transport to send emails through. Defaults to 'gmail';
   * set EMAIL_TRANSPORT=json to use nodemailer's no-op JSON transport
   * instead (e.g. the integration tests run against the Firebase Emulator
   * Suite and must never send real emails - see
   * scripts/run-integration-tests.sh).
   */
  get emailTransport(): EmailTransport {
    return process.env.EMAIL_TRANSPORT === 'json' ? 'json' : 'gmail'
  }

  get app(): IAppConfig {
    return {
      name: process.env.APP_NAME || 'Plan Your Meals',
      url: process.env.APP_URL || 'http://localhost:3000',
      corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
    }
  }
}

export const config = new Config()
