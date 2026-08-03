const MessagingConfig = require('../models/MessagingConfig');
const { decrypt } = require('../config/encryption');

/**
 * Send a WhatsApp reminder message using Meta WhatsApp Cloud API (Graph API v25.0).
 * 
 * @param {Object} params
 * @param {string} params.phone Customer phone number
 * @param {string} params.customerName Customer name
 * @param {string} params.serviceName Service rendered
 * @param {Date|string} params.visitDate Date of visit
 * @param {string} [params.templateName] Optional template name
 */
async function sendReminder({ phone, customerName, serviceName = 'Salon Service', visitDate, templateName }) {
  // Find or create default config if none exists yet
  let config = await MessagingConfig.findOne();
  if (!config) {
    config = await MessagingConfig.create({
      provider: 'meta_cloud',
      testMode: false,
      templateNameDueDay: 'salon_reminder_today',
    });
  } else if (config.testMode || config.provider !== 'meta_cloud') {
    config.provider = 'meta_cloud';
    config.testMode = false;
    await config.save();
  }

  // Format phone number to international format (defaulting to India +91 if 10 digits)
  let cleanedPhone = (phone || '').replace(/\D/g, '');
  if (cleanedPhone.length === 10) {
    cleanedPhone = '91' + cleanedPhone;
  }

  const formattedDate = visitDate
    ? new Date(visitDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const selectedTemplate = templateName || config.templateNameDueDay || 'salon_reminder_today';

  // Decrypt API Key / Access Token if present, or read from process.env
  const rawAccessToken = config.apiKey ? decrypt(config.apiKey) : process.env.META_WA_ACCESS_TOKEN || null;
  const phoneNumberId = config.phoneNumberId || process.env.META_WA_PHONE_NUMBER_ID || null;

  const isPlaceholderToken = !rawAccessToken || rawAccessToken === 'YOUR_PERMANENT_ACCESS_TOKEN';
  const isPlaceholderPhoneId = !phoneNumberId || phoneNumberId === 'YOUR_PHONE_NUMBER_ID';

  // DEMO / TEST MODE or missing credentials fallback
  if (config.testMode || isPlaceholderToken || isPlaceholderPhoneId) {
    console.log(`[META WA CLOUD API SIMULATION - v25.0]`);
    console.log(`  To: ${cleanedPhone}`);
    console.log(`  Customer: ${customerName}`);
    console.log(`  Service: ${serviceName}`);
    console.log(`  Template: ${selectedTemplate}`);
    console.log(`  Date: ${formattedDate}`);
    if (isPlaceholderToken || isPlaceholderPhoneId) {
      console.log(`  Note: Replace META_WA_ACCESS_TOKEN and META_WA_PHONE_NUMBER_ID in backend/.env with live credentials to transmit real WhatsApp messages.`);
    }
    
    return {
      success: true,
      simulated: true,
      messageId: `SIM_WA_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      sentTime: new Date(),
      deliveryStatus: 'simulated',
      apiResponse: { status: 'simulated', message: 'Simulated send in demo mode' },
    };
  }

  // REAL MODE: Meta WhatsApp Cloud API (Graph API v25.0)
  return sendViaMetaCloud({
    phoneNumberId,
    accessToken: rawAccessToken,
    toPhone: cleanedPhone,
    templateName: selectedTemplate,
    customerName,
    serviceName,
    formattedDate,
  });
}

async function sendViaMetaCloud({ phoneNumberId, accessToken, toPhone, templateName, customerName, serviceName, formattedDate }) {
  try {
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: serviceName },
              { type: 'text', text: formattedDate },
            ],
          },
        ],
      },
    };

    console.log(`[META WA CLOUD API SEND (v25.0)] Requesting ${url} for ${toPhone}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || `HTTP error ${response.status}`;
      console.error(`[META WA CLOUD API ERROR (v25.0)] ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        deliveryStatus: 'failed',
        apiResponse: data,
        sentTime: new Date(),
      };
    }

    const messageId = data?.messages?.[0]?.id || `WA_MSG_${Date.now()}`;

    return {
      success: true,
      simulated: false,
      messageId,
      sentTime: new Date(),
      deliveryStatus: 'sent',
      apiResponse: data,
    };
  } catch (error) {
    console.error('[META WA CLOUD API EXCEPTION (v25.0)]', error.message);
    return {
      success: false,
      error: error.message,
      deliveryStatus: 'failed',
      sentTime: new Date(),
      apiResponse: { error: error.message },
    };
  }
}

module.exports = { sendReminder, sendViaMetaCloud };
