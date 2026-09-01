import * as nodemailer from 'nodemailer'
import Mail = require('nodemailer/lib/mailer')
import { config } from './config-service'

/**
 * Here we're using Gmail to send, unless EMAIL_TRANSPORT=json (see
 * config-service.ts).
 */
const transporter =
  config.emailTransport === 'json'
    ? nodemailer.createTransport({ jsonTransport: true })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmailConfig.user,
          pass: config.gmailConfig.password,
        },
      })

export const emailServices = {
  async sendEmail(from: string | Mail.Address, to: string, subject: string, html: string) {
    const mailOptions: Mail.Options = {
      from,
      to,
      subject,
      html,
    }
    console.log('Send email', mailOptions)
    // returning result
    return transporter.sendMail(mailOptions)
  },
}
