'use server'

import tls from 'node:tls'

export interface SmtpEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

/**
 * Sends an email over standard SMTP (port 465 SSL/TLS or 587) using Node.js native TLS socket.
 * Zero external dependencies required.
 */
export async function sendSmtpEmail(
  options: SmtpEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = process.env.SMTP_USER || 'official.doonext@gmail.com'
  const pass = process.env.SMTP_PASS || 'kvvmyoypzrtdgwjq'
  const defaultFrom = process.env.SMTP_FROM || `StayNext PMS <${user}>`
  const from = options.from || defaultFrom

  // Extract bare email address from "Name <email@domain>" format
  const extractEmail = (str: string) => {
    const match = str.match(/<([^>]+)>/)
    return match ? match[1].trim() : str.trim()
  }

  const fromEmail = extractEmail(from)
  const recipients = Array.isArray(options.to) ? options.to : [options.to]
  const toEmails = recipients.map(extractEmail)

  if (!user || !pass) {
    return { success: false, error: 'SMTP user and password are not configured in environment.' }
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      try {
        socket.destroy()
      } catch {}
      resolve({ success: false, error: 'SMTP connection timed out after 20 seconds.' })
    }, 20000)

    let socket: tls.TLSSocket

    try {
      socket = tls.connect({
        host,
        port,
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false, // Prevents self-signed or proxy cert drops
      })
    } catch (err: any) {
      clearTimeout(timeout)
      return resolve({ success: false, error: `Socket init error: ${err.message}` })
    }

    let buffer = ''
    let stage = 'CONNECT'
    let recipientIndex = 0
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${host}>`

    socket.setEncoding('utf8')

    const sendCommand = (cmd: string) => {
      socket.write(`${cmd}\r\n`)
    }

    socket.on('data', (chunk: string) => {
      buffer += chunk
      const lines = buffer.split('\r\n')

      // Process complete responses
      while (lines.length > 1) {
        const line = lines.shift()!
        if (!line) continue

        const code = parseInt(line.substring(0, 3), 10)
        const isMultiLine = line.charAt(3) === '-'

        if (isMultiLine) {
          // Multiline response (e.g. 250-SIZE), wait for final line
          continue
        }

        // Handle Protocol Stages
        if (stage === 'CONNECT' && code === 220) {
          stage = 'EHLO'
          sendCommand(`EHLO staynext.pms`)
        } else if (stage === 'EHLO' && code === 250) {
          stage = 'AUTH_LOGIN'
          sendCommand('AUTH LOGIN')
        } else if (stage === 'AUTH_LOGIN' && code === 334) {
          stage = 'AUTH_USER'
          sendCommand(Buffer.from(user).toString('base64'))
        } else if (stage === 'AUTH_USER' && code === 334) {
          stage = 'AUTH_PASS'
          sendCommand(Buffer.from(pass).toString('base64'))
        } else if (stage === 'AUTH_PASS' && code === 235) {
          // Auth accepted
          stage = 'MAIL_FROM'
          sendCommand(`MAIL FROM:<${fromEmail}>`)
        } else if (stage === 'MAIL_FROM' && code === 250) {
          stage = 'RCPT_TO'
          recipientIndex = 0
          sendCommand(`RCPT TO:<${toEmails[recipientIndex]}>`)
        } else if (stage === 'RCPT_TO' && (code === 250 || code === 251)) {
          recipientIndex++
          if (recipientIndex < toEmails.length) {
            sendCommand(`RCPT TO:<${toEmails[recipientIndex]}>`)
          } else {
            stage = 'DATA'
            sendCommand('DATA')
          }
        } else if (stage === 'DATA' && code === 354) {
          stage = 'SEND_BODY'

          // Construct MIME email headers & HTML payload
          const dateStr = new Date().toUTCString()
          const headers = [
            `From: ${from}`,
            `To: ${recipients.join(', ')}`,
            `Subject: ${options.subject}`,
            `Date: ${dateStr}`,
            `Message-ID: ${messageId}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            options.html,
            '.',
          ].join('\r\n')

          sendCommand(headers)
        } else if (stage === 'SEND_BODY' && code === 250) {
          stage = 'QUIT'
          sendCommand('QUIT')
          clearTimeout(timeout)
          socket.end()
          return resolve({ success: true, messageId })
        } else if (stage === 'QUIT') {
          // Normal disconnect
        } else if (code >= 400) {
          clearTimeout(timeout)
          socket.destroy()
          return resolve({
            success: false,
            error: `SMTP error (${code}) at stage ${stage}: ${line}`,
          })
        }
      }

      buffer = lines[0] || ''
    })

    socket.on('error', (err: any) => {
      clearTimeout(timeout)
      resolve({ success: false, error: `SMTP Socket error: ${err.message}` })
    })

    socket.on('close', () => {
      clearTimeout(timeout)
      if (stage !== 'QUIT' && stage !== 'SEND_BODY') {
        resolve({ success: false, error: `SMTP connection closed prematurely at stage ${stage}` })
      }
    })
  })
}

/**
 * Send a quick test email to verify SMTP configuration
 */
export async function sendTestSmtpEmail(
  testEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendSmtpEmail({
    to: testEmail,
    subject: '🔔 [StayNext Test] Gmail SMTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #5e2b9d; margin-top: 0;">StayNext SMTP Mailer Verification</h2>
        <p style="color: #374151; font-size: 14px;">
          This test email confirms that your Gmail SMTP credentials (<code>smtp.gmail.com:465</code>) are active and sending emails successfully.
        </p>
        <div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 12px; color: #4b5563; margin: 16px 0;">
          <div><strong>Sender:</strong> ${process.env.SMTP_FROM || process.env.SMTP_USER}</div>
          <div><strong>Recipient:</strong> ${testEmail}</div>
          <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
        </div>
        <p style="color: #6b7280; font-size: 12px;">StayNext Hotel Management System</p>
      </div>
    `,
  })
}
