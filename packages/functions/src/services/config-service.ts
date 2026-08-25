import * as dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

interface IGmailConfig {
  user: string
  password: string
}

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

  get app(): IAppConfig {
    return {
      name: process.env.APP_NAME || 'Plan Your Meals',
      url: process.env.APP_URL || 'http://localhost:3000',
      corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim()),
    }
  }
}

export const config = new Config()
