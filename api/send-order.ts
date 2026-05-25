import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export default async function handler(req: Request, res: Response) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { 
      name, 
      email, 
      mobileNo, 
      ign, 
      playerType, 
      discordUsername, 
      cartItems, 
      currency,
      cartId,
      timestamp 
    } = req.body;

    // Server-side robust validation
    if (!name || !email || !mobileNo || !ign || !playerType || !discordUsername) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required credentials. All fields are mandatory.' 
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Your shopping cart must contain at least one item.' 
      });
    }

    const isINR = currency === 'INR';
    const totalUSD = cartItems.reduce((sum: number, item: any) => sum + (item.product.priceUSD || 0) * item.quantity, 0);
    const totalINR = cartItems.reduce((sum: number, item: any) => sum + (item.product.priceINR || 0) * item.quantity, 0);
    
    const currencySymbol = isINR ? '₹' : '$';
    const orderSumTotal = `${currencySymbol}${isINR ? totalINR : totalUSD.toFixed(2)} ${currency}`;

    // --- Action A: Discord Webhook dispatch ---
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    let discordSuccess = false;

    if (webhookUrl) {
      const itemsListText = cartItems.map(
        (item: any) => `• **${item.product.name}** x${item.quantity} (${isINR ? `₹${item.product.priceINR}` : `$${item.product.priceUSD}`} each)`
      ).join('\n');

      const cleanDiscordUser = discordUsername.replace(/[*`_~|>@#:&]/g, '');

      const discordEmbed = {
        title: '👑 New MineBerry Premium Order Settle Hub',
        description: 'A custom high-performance checkout ticket has been automatically completed by the customer.',
        color: playerType === 'Java' ? 3718648 : 14254255, // Cyan (#38bdf8) or fuchsia (#d946ef)
        fields: [
          { name: '🆔 Order / Cart ID', value: `\`${cartId}\``, inline: true },
          { name: '📅 Timestamp', value: `\`${timestamp}\``, inline: true },
          { name: '💵 Active Currency', value: `\`${currency}\``, inline: true },
          { name: '👤 Client Name', value: `\`${name.trim()}\``, inline: true },
          { name: '📧 Email Address', value: `\`${email.trim()}\``, inline: true },
          { name: '📱 Mobile Number', value: `\`${mobileNo.trim()}\``, inline: true },
          { name: '🎮 Character IGN', value: `**${ign.trim()}**`, inline: true },
          { name: '⚙️ Player Type', value: `\`${playerType} Edition\``, inline: true },
          { name: '💬 Discord Handle', value: cleanDiscordUser, inline: true },
          { name: '📦 Order Basket Items', value: itemsListText, inline: false },
          { name: '💳 Subtotal Checkout Sum', value: `**${orderSumTotal}**`, inline: true }
        ],
        thumbnail: {
          url: `https://mc-heads.net/avatar/${encodeURIComponent(ign)}/128`
        },
        footer: {
          text: 'MineBerry Dynamic Sanctuary Store Engine • Unified Complete'
        },
        timestamp: timestamp
      };

      const payload = {
        username: 'MineBerry Automated Order Engine',
        avatar_url: 'https://minotar.net/avatar/MHF_Cake/128',
        embeds: [discordEmbed]
      };

      try {
        const discordResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (discordResponse.ok) {
          discordSuccess = true;
        } else {
          console.error('Discord webhook rejected payload:', await discordResponse.text());
        }
      } catch (err) {
        console.error('Failed to trigger Discord webhook:', err);
      }
    } else {
      console.warn('DISCORD_WEBHOOK_URL is not defined. Skipping Discord notification block.');
    }

    // --- Action B: Email receipt copy dispatch with nodemailer ---
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    let emailSuccess = false;

    if (gmailUser && gmailAppPassword) {
      // Create transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      // Construct beautifully styled HTML card mirroring MineBerry's premium storefront look
      const itemsHtml = cartItems.map((item: any) => `
        <tr style="border-bottom: 1px solid #1a2e2e;">
          <td style="padding: 12px 6px; font-size: 13px; color: #ffffff;">
            <strong>${item.product.name}</strong> <span style="color: #a3a3a3; font-size: 11px;">x${item.quantity}</span>
          </td>
          <td style="padding: 12px 6px; text-align: right; font-size: 13px; font-family: monospace; color: #34d399;">
            ${isINR ? `₹${item.product.priceINR * item.quantity}` : `$${(item.product.priceUSD * item.quantity).toFixed(2)}`}
          </td>
        </tr>
      `).join('');

      const accentColor = playerType === 'Java' ? '#38bdf8' : '#d946ef';

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>MineBerry Premium Receipt Card</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #050b0b; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #e5e7eb;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050b0b; padding: 40px 10px;">
            <tr>
              <td align="center">
                <!-- Outer Envelope Card -->
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #091515; border: 1px solid #10b98120; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.7);">
                  
                  <!-- Top branding row -->
                  <tr>
                    <td style="background-color: #0c1c1c; padding: 24px; border-bottom: 1px solid #1a2e2e; text-align: center;">
                      <h2 style="margin: 0; font-size: 20px; font-weight: 900; color: #38bdf8; letter-spacing: 1px; text-shadow: 0 0 10px rgba(56,189,248,0.3);">
                        MINEBERRY OFFICIAL STORE
                      </h2>
                      <p style="margin: 4px 0 0 0; font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 1.5px;">Premium Order Ledger Invoice</p>
                    </td>
                  </tr>

                  <!-- Left accent color divider simulation -->
                  <tr>
                    <td height="4" style="background-color: ${accentColor};"></td>
                  </tr>

                  <!-- Welcome banner -->
                  <tr>
                    <td style="padding: 24px 32px 16px 32px;">
                      <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; text-transform: uppercase;">Hello ${name.trim()},</h3>
                      <p style="margin: 8px 0 0 0; font-size: 13px; color: #d1d5db; line-height: 1.5;">
                        Thank you for your donation supporting the MineBerry Sanctuary. Your premium order payload has been finalized and synchronised cleanly over the administrative validation queue.
                      </p>
                    </td>
                  </tr>

                  <!-- Details Grid (Styled cards inside email) -->
                  <tr>
                    <td style="padding: 0 32px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050b0b; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        
                        <!-- Order ID & Timestamp -->
                        <tr>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Order / Cart ID</span>
                            <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #ffffff;">${cartId}</span>
                          </td>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Timestamp</span>
                            <span style="font-family: monospace; font-size: 12px; color: #d1d5db;">${timestamp}</span>
                          </td>
                        </tr>

                        <!-- Client details and platform -->
                        <tr>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Character IGN</span>
                            <span style="font-size: 13px; font-weight: bold; color: #34d399;">${ign.trim()}</span>
                          </td>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Platform Edition</span>
                            <span style="font-size: 13px; font-weight: bold; color: ${accentColor};">${playerType} Edition</span>
                          </td>
                        </tr>

                        <!-- Mobile & Discord username -->
                        <tr>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Mobile Number</span>
                            <span style="font-family: monospace; font-size: 13px; color: #ffffff;">${mobileNo.trim()}</span>
                          </td>
                          <td width="50%" style="padding: 8px; vertical-align: top;">
                            <span style="display: block; font-size: 10px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Discord Handle</span>
                            <span style="font-family: monospace; font-size: 13px; color: #ffffff;">${discordUsername.trim()}</span>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Shopping items heading -->
                  <tr>
                    <td style="padding: 0 32px;">
                      <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #38bdf8; letter-spacing: 0.5px;">
                        Purchased Basket List
                      </h4>
                    </td>
                  </tr>

                  <!-- Items Table details -->
                  <tr>
                    <td style="padding: 0 32px 24px 32px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                        <!-- Table header -->
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); background-color: #050b0b;">
                          <th align="left" style="padding: 8px 6px; font-size: 11px; text-transform: uppercase; color: #a3a3a3; font-weight: bold;">Product Details</th>
                          <th align="right" style="padding: 8px 6px; font-size: 11px; text-transform: uppercase; color: #a3a3a3; font-weight: bold;">Price</th>
                        </tr>
                        ${itemsHtml}
                      </table>
                    </td>
                  </tr>

                  <!-- Summary banner -->
                  <tr>
                    <td style="padding: 0 32px 32px 32px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(52, 211, 153, 0.05); border: 1px solid rgba(52, 211, 153, 0.2); border-radius: 12px; padding: 16px;">
                        <tr>
                          <td>
                            <span style="font-size: 11px; color: #a3a3a3; text-transform: uppercase; font-weight: bold; display: block;">Total Paid Sum</span>
                            <span style="font-size: 10px; color: #38bdf8;">Paid via Instant Gateway Settle</span>
                          </td>
                          <td align="right" style="font-size: 20px; font-family: monospace; font-weight: 900; color: #34d399; text-shadow: 0 0 10px rgba(52,211,153,0.3);">
                            ${orderSumTotal}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer Notes -->
                  <tr>
                    <td style="background-color: #0c1c1c; padding: 20px 32px; font-size: 11px; color: #737373; text-align: center; border-top: 1px solid #1a2e2e; line-height: 1.4;">
                      <p style="margin: 0 0 4px 0;">All digital goods and keys deliver instantly in game play. Connecting client to <strong>play.mineberry.net</strong> initiates system activation.</p>
                      <p style="margin: 0;">&copy; 2026 MineBerry Premium Sanctuary Hub. All rights reserved.</p>
                      <p style="margin: 8px 0 0 0; font-size: 10px; color: #a3a3a3; font-weight: bold; border-top: 1px solid #10b98115; padding-top: 8px;">
                        Engine Built &amp; Maintained by aurtx | Discord: aurtx_99102 (&lt;@1459859699624186053&gt;) | Contact: prince2020me1@gmail.com
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      try {
        await transporter.sendMail({
          from: `"MineBerry Store" <${gmailUser}>`,
          to: email.trim(),
          subject: `👑 Order Confirmed - Receipt #${cartId} on play.mineberry.net`,
          html: htmlBody,
        });
        emailSuccess = true;
        console.log(`Successfully dispatched order confirmation email to ${email.trim()}`);
      } catch (err) {
        console.error('Nodemailer failed to deliver email:', err);
      }
    } else {
      console.warn('GMAIL_USER and GMAIL_APP_PASSWORD are not fully configured. Skipping email dispatching.');
    }

    return res.status(200).json({ 
      success: true, 
      cartId, 
      timestamp,
      discordDispatched: webhookUrl ? discordSuccess : false,
      emailDispatched: (gmailUser && gmailAppPassword) ? emailSuccess : false
    });
  } catch (error: any) {
    console.error('Unified Checkout serverless function error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred while processing checkout.' 
    });
  }
}
