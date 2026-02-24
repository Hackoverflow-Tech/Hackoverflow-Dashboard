/**
 * Email HTML Template
 *
 * Professional email template wrapper with HackOverflow branding.
 * Includes mobile-responsive design and email client compatibility.
 *
 * @module lib/email-template
 */

export interface EmailTemplateData {
  content: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientRole?: string;
  recipientCompany?: string;
}

export function wrapInTemplate(data: EmailTemplateData): string {
  const { content } = data;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Email from HackOverflow 4.0</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      -webkit-font-smoothing: antialiased !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a { text-decoration: none; }
    *[x-apple-data-detectors],
    .unstyle-auto-detected-links *,
    .aBn {
      border-bottom: 0 !important;
      cursor: default !important;
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding: 25px 20px !important; }
      .mobile-padding-small { padding: 20px 15px !important; }
      .mobile-text-center { text-align: center !important; }
      .mobile-full-width { width: 100% !important; max-width: 100% !important; }
      .mobile-hide { display: none !important; }
      .mobile-h1 { font-size: 28px !important; line-height: 1.3 !important; }
      .mobile-h2 { font-size: 22px !important; }
      .mobile-h3 { font-size: 18px !important; }
      .mobile-button { padding: 14px 30px !important; font-size: 14px !important; }
      .mobile-logo { width: 120px !important; height: auto !important; }
      .social-icon { width: 32px !important; height: 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0F0F0F; font-family: 'Poppins', Arial, Helvetica, sans-serif; width: 100% !important;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    HackOverflow 4.0 - Join us for an incredible 36-hour hackathon experience!
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0F0F0F;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0F0F0F 100%);">
          <tr>
            <td style="background: linear-gradient(135deg, #0F0F0F 0%, #1a1a1a 100%); padding: 35px 30px; text-align: center; border-bottom: 3px solid #FCB216;" class="mobile-padding-small">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <img src="https://hackoverflow4.tech/images/Logo.png" alt="HackOverflow Logo" width="160" height="auto" style="display: block; margin: 0 auto 15px auto; max-width: 160px; height: auto;" class="mobile-logo" />
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-family: 'Poppins', Arial, Helvetica, sans-serif; line-height: 1.2;" class="mobile-h1">
                      HACK<span style="color: #FCB216;">OVERFLOW</span>
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">4.0</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 35px; background-color: #0F0F0F;" class="mobile-padding">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 35px;" class="mobile-padding-small">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="height: 2px; background: linear-gradient(90deg, transparent, rgba(252, 178, 22, 0.5), transparent);"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0F0F0F; padding: 35px 35px 30px 35px;" class="mobile-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; color: #B0B0B0; font-size: 14px; line-height: 1.6; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                      This email was sent via <strong style="color: #FFD47C;">HackOverflow Mailer</strong>
                    </p>
                    <p style="margin: 0; color: #888888; font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                      © ${new Date().getFullYear()} HackOverflow 4.0. All rights reserved.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="mailto:hackoverflow@mes.ac.in" style="display: inline-block; text-decoration: none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="width: 44px; height: 44px; background-color: rgba(252, 178, 22, 0.15); border: 1px solid rgba(252, 178, 22, 0.4); border-radius: 50%; text-align: center; line-height: 44px;" class="social-icon">
                                  <span style="color: #FCB216; font-size: 20px; line-height: 44px;">✉️</span>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://hackoverflow4.tech/" target="_blank" style="display: inline-block; text-decoration: none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="width: 44px; height: 44px; background-color: rgba(232, 93, 36, 0.15); border: 1px solid rgba(232, 93, 36, 0.4); border-radius: 50%; text-align: center; line-height: 44px;" class="social-icon">
                                  <span style="color: #E85D24; font-size: 20px; line-height: 44px;">🌐</span>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://www.instagram.com/hackoverflow.tech" target="_blank" style="display: inline-block; text-decoration: none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="width: 44px; height: 44px; background-color: rgba(217, 27, 87, 0.15); border: 1px solid rgba(217, 27, 87, 0.4); border-radius: 50%; text-align: center; line-height: 44px;" class="social-icon">
                                  <span style="color: #D91B57; font-size: 20px; line-height: 44px;">📸</span>
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding: 15px 0; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 8px 0; color: #888888; font-size: 11px; line-height: 1.6; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                      You received this email because you're a participant in HackOverflow 4.0.
                    </p>
                    <p style="margin: 0; font-size: 11px; line-height: 1.6; font-family: 'Poppins', Arial, Helvetica, sans-serif;">
                      <a href="https://hackoverflow4.tech/" style="color: #FCB216; text-decoration: underline;">Visit Website</a> |
                      <a href="https://www.instagram.com/hackoverflow.tech" style="color: #FCB216; text-decoration: underline;">Follow Us</a> |
                      <a href="mailto:hackoverflow@mes.ac.in" style="color: #FCB216; text-decoration: underline;">Contact Us</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/** Reusable email inline styles */
export const emailStyles = {
  heading1: 'margin: 0 0 20px 0; color: #FFFFFF; font-size: 34px; font-weight: 800; line-height: 1.3; font-family: "Poppins", Arial, Helvetica, sans-serif; letter-spacing: -0.5px;',
  heading2: 'margin: 0 0 18px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; line-height: 1.3; font-family: "Poppins", Arial, Helvetica, sans-serif;',
  heading3: 'margin: 0 0 14px 0; color: #FFD47C; font-size: 22px; font-weight: 700; line-height: 1.4; font-family: "Poppins", Arial, Helvetica, sans-serif;',
  paragraph: 'margin: 0 0 16px 0; color: #E0E0E0; font-size: 16px; line-height: 1.7; font-family: "Poppins", Arial, Helvetica, sans-serif;',
  paragraphMuted: 'margin: 0 0 16px 0; color: #B0B0B0; font-size: 15px; line-height: 1.7; font-family: "Poppins", Arial, Helvetica, sans-serif;',
  link: 'color: #FCB216; text-decoration: underline; font-weight: 600;',
  list: 'margin: 0 0 20px 0; padding: 0 0 0 20px; color: #E0E0E0; font-size: 16px; line-height: 1.9; font-family: "Poppins", Arial, Helvetica, sans-serif;',
  listItem: 'margin-bottom: 10px; color: #E0E0E0;',
  divider: 'border: none; height: 2px; background: linear-gradient(90deg, transparent, rgba(252, 178, 22, 0.5), transparent); margin: 25px 0;',
  badge: 'display: inline-block; padding: 8px 18px; background-color: rgba(231, 88, 41, 0.2); border: 1px solid rgba(231, 88, 41, 0.5); border-radius: 50px; color: #FFD47C; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 16px 0;',
  gradientText: 'color: #FCB216; font-weight: 700;',
} as const;

/** Creates an email-safe styled button */
export function createButton(text: string, url: string, gradient: boolean = true): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 20px auto;">
      <tr>
        <td align="center" style="border-radius: 10px; background: ${gradient ? 'linear-gradient(90deg, #FCB216 0%, #E85D24 100%)' : 'transparent'}; ${gradient ? '' : 'border: 2px solid #FCB216;'}">
          <a href="${url}" target="_blank" style="display: inline-block; padding: ${gradient ? '16px 45px' : '14px 43px'}; color: ${gradient ? '#FFFFFF' : '#FCB216'}; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-button">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/** Creates an info card/box for emails */
export function createInfoBox(title: string, content: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(252, 178, 22, 0.3); border-left: 4px solid #FCB216; border-radius: 8px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 22px 24px;">
          <h3 style="${emailStyles.heading3}">${title}</h3>
          <p style="${emailStyles.paragraph}">${content}</p>
        </td>
      </tr>
    </table>
  `;
}

/** Creates a countdown/date card for emails */
export function createDateCard(day: string, month: string, label: string, color: string = '#FCB216'): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 10px auto; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 24px 30px; text-align: center; min-width: 150px;">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0 0 8px 0; color: #B0B0B0; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${month}</p>
          <h2 style="margin: 0 0 8px 0; color: ${color}; font-size: 48px; font-weight: 800; line-height: 1; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${day}</h2>
          <p style="margin: 0 0 12px 0; color: #FFFFFF; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-family: 'Poppins', Arial, Helvetica, sans-serif;">${label}</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="height: 3px; background-color: ${color}; border-radius: 3px;"></td></tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/** Pre-built email templates for common hackathon communications */
export const exampleTemplates = {
  welcome: `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; margin-bottom: 25px;"><span style="${emailStyles.badge}">Welcome Aboard! 🎉</span></td></tr>
    </table>
    <h1 style="${emailStyles.heading1}" class="mobile-h1">Welcome to <span style="${emailStyles.gradientText}">HackOverflow 4.0</span>!</h1>
    <p style="${emailStyles.paragraph}">We're thrilled to have you join us for an incredible 36-hour journey of innovation, collaboration, and creativity.</p>
    ${createInfoBox('Event Details', 'Mark your calendars! The hackathon kicks off on <strong style="color: #FFD47C;">March 21st</strong> and runs through <strong style="color: #FFD47C;">March 23rd</strong>.')}
    <h2 style="${emailStyles.heading2}" class="mobile-h2">What to Expect:</h2>
    <ul style="${emailStyles.list}">
      <li style="${emailStyles.listItem}">🚀 <strong style="color: #FFD47C;">36 hours</strong> of intense coding</li>
      <li style="${emailStyles.listItem}">🎓 Mentorship from industry experts</li>
      <li style="${emailStyles.listItem}">🍕 All meals and refreshments provided</li>
      <li style="${emailStyles.listItem}">🏆 Amazing prizes and swag</li>
      <li style="${emailStyles.listItem}">🤝 Networking opportunities</li>
    </ul>
    ${createButton('View Complete Schedule', 'https://hackoverflow4.tech/')}
    <p style="${emailStyles.paragraph}">See you soon!<br><strong style="color: #FFD47C;">The HackOverflow Team</strong></p>
  `,

  reminder: `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; margin-bottom: 25px;"><span style="${emailStyles.badge}">Reminder ⏰</span></td></tr>
    </table>
    <h1 style="${emailStyles.heading1}" class="mobile-h1">HackOverflow 4.0 <span style="${emailStyles.gradientText}">Starts Tomorrow!</span></h1>
    <p style="${emailStyles.paragraph}">The big day is almost here! Make sure you're all set for tomorrow's kickoff.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; padding: 20px 0;">${createDateCard('21', 'MARCH', 'Kickoff', '#FCB216')}</td></tr>
    </table>
    <h2 style="${emailStyles.heading2}" class="mobile-h2">Pre-Event Checklist:</h2>
    <ul style="${emailStyles.list}">
      <li style="${emailStyles.listItem}">✅ Laptop, charger, and cables</li>
      <li style="${emailStyles.listItem}">✅ Government-issued photo ID</li>
      <li style="${emailStyles.listItem}">✅ Comfortable clothes</li>
      <li style="${emailStyles.listItem}">✅ Your creativity and problem-solving mindset</li>
    </ul>
    ${createInfoBox('Check-In', 'Registration starts at <strong style="color: #FFD47C;">11:00 AM</strong> at the main campus entrance.')}
    ${createButton('Get Directions', 'https://hackoverflow4.tech/')}
    <p style="${emailStyles.paragraph}">Let's make this unforgettable! 🚀<br><strong style="color: #FFD47C;">The HackOverflow Team</strong></p>
  `,

  announcement: `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; margin-bottom: 25px;"><span style="${emailStyles.badge}">Important Update 📢</span></td></tr>
    </table>
    <h1 style="${emailStyles.heading1}" class="mobile-h1"><span style="${emailStyles.gradientText}">Important</span> Announcement</h1>
    <p style="${emailStyles.paragraph}">We have an important update regarding HackOverflow 4.0.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(252, 178, 22, 0.1); border-left: 4px solid #FCB216; border-radius: 8px; margin: 20px 0;">
      <tr><td style="padding: 22px 24px;">
        <p style="${emailStyles.paragraph}"><strong style="color: #FCB216; font-size: 18px;">What's Changed:</strong></p>
        <p style="${emailStyles.paragraph}">[Your announcement content here]</p>
      </td></tr>
    </table>
    ${createButton('View Full Details', 'https://hackoverflow4.tech/')}
    <p style="${emailStyles.paragraph}">Best regards,<br><strong style="color: #FFD47C;">The HackOverflow Organizing Team</strong></p>
  `,

  thankYou: `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; margin-bottom: 25px;"><span style="${emailStyles.badge}">Thank You! 🙏</span></td></tr>
    </table>
    <h1 style="${emailStyles.heading1}" class="mobile-h1">You Were <span style="${emailStyles.gradientText}">Amazing</span>!</h1>
    <p style="${emailStyles.paragraph}">HackOverflow 4.0 has come to an end, and we couldn't be more proud of what you accomplished!</p>
    <h2 style="${emailStyles.heading2}" class="mobile-h2">What's Next:</h2>
    <ul style="${emailStyles.list}">
      <li style="${emailStyles.listItem}">📸 Event photos coming soon</li>
      <li style="${emailStyles.listItem}">🏆 Winners contacted for prizes</li>
      <li style="${emailStyles.listItem}">📧 Certificates of participation on the way</li>
      <li style="${emailStyles.listItem}">🔗 Stay connected on our platforms</li>
    </ul>
    ${createButton('View Event Highlights', 'https://hackoverflow4.tech/')}
    <p style="${emailStyles.paragraph}">With gratitude,<br><strong style="color: #FFD47C;">The HackOverflow Team</strong></p>
  `,

  themeAnnouncement: `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr><td style="text-align: center; margin-bottom: 25px;"><span style="${emailStyles.badge}">Theme Reveal 🎯</span></td></tr>
    </table>
    <h1 style="${emailStyles.heading1}" class="mobile-h1">The Wait is <span style="${emailStyles.gradientText}">Over</span>!</h1>
    <p style="${emailStyles.paragraph}">We're excited to reveal the official themes for HackOverflow 4.0.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 25px 0;">
      <tr><td>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(252, 178, 22, 0.1); border: 2px solid rgba(252, 178, 22, 0.4); border-radius: 12px; padding: 22px 24px; margin-bottom: 15px;">
          <tr><td><h3 style="margin: 0 0 10px 0; color: #FCB216; font-size: 20px; font-weight: 700;">🤖 Theme 1: AI & Machine Learning</h3><p style="margin: 0; color: #E0E0E0; font-size: 15px; line-height: 1.6;">Build intelligent solutions leveraging AI</p></td></tr>
        </table>
      </td></tr>
      <tr><td>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(232, 93, 36, 0.1); border: 2px solid rgba(232, 93, 36, 0.4); border-radius: 12px; padding: 22px 24px; margin-bottom: 15px;">
          <tr><td><h3 style="margin: 0 0 10px 0; color: #E85D24; font-size: 20px; font-weight: 700;">🌍 Theme 2: Sustainability & Climate</h3><p style="margin: 0; color: #E0E0E0; font-size: 15px; line-height: 1.6;">Innovative solutions for environmental challenges</p></td></tr>
        </table>
      </td></tr>
      <tr><td>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(217, 27, 87, 0.1); border: 2px solid rgba(217, 27, 87, 0.4); border-radius: 12px; padding: 22px 24px;">
          <tr><td><h3 style="margin: 0 0 10px 0; color: #D91B57; font-size: 20px; font-weight: 700;">💡 Theme 3: Social Impact</h3><p style="margin: 0; color: #E0E0E0; font-size: 15px; line-height: 1.6;">Technology that makes a positive difference</p></td></tr>
        </table>
      </td></tr>
    </table>
    ${createButton('View Full Theme Details', 'https://hackoverflow4.tech/')}
    <p style="${emailStyles.paragraph}">Happy hacking! 🚀<br><strong style="color: #FFD47C;">The HackOverflow Team</strong></p>
  `,
} as const;
