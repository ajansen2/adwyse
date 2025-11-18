import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  // Initialize clients inside the function to avoid build-time errors
  const resend = new Resend(process.env.RESEND_API_KEY);
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  try {
    const { cartId, emailNumber, testEmail } = await request.json();

    if (!cartId || !emailNumber) {
      return NextResponse.json(
        { error: 'Missing cartId or emailNumber' },
        { status: 400 }
      );
    }

    console.log(`📧 Sending recovery email ${emailNumber} for cart ${cartId}${testEmail ? ` (test mode to ${testEmail})` : ''}`);

    // Validate environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not set');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not set');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    // Get cart data from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: cart, error: cartError } = await supabase
      .from('abandoned_carts')
      .select('*, stores(*)')
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      console.error('Cart not found:', cartError);
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Validate cart has required fields
    if (!cart.customer_email) {
      console.error('❌ Cart missing customer_email');
      return NextResponse.json({ error: 'Cart missing customer email' }, { status: 400 });
    }
    if (!cart.abandoned_checkout_url) {
      console.error('❌ Cart missing abandoned_checkout_url');
      return NextResponse.json({ error: 'Cart missing checkout URL' }, { status: 400 });
    }

    console.log('✅ Cart validated:', { email: cart.customer_email, value: cart.cart_value });

    console.log('📝 Generating AI email content...');

    // Fetch merchant settings separately
    let merchantSettings = null;
    if (cart.stores?.merchant_id) {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select('settings')
        .eq('id', cart.stores.merchant_id)
        .single();

      merchantSettings = merchantData?.settings;
    }

    // Generate AI-powered email content
    let emailContent;
    try {
      emailContent = await generateEmailContent(cart, emailNumber, anthropic, merchantSettings);
      console.log('✅ AI email content generated');
    } catch (aiError) {
      console.error('❌ Failed to generate AI email content:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate email content', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Send email via Resend
    // Using verified domain from environment variable
    // Normalize email to lowercase for Resend compatibility
    // Use testEmail if provided (for Shopify reviewers), otherwise use cart customer email
    const recipientEmail = (testEmail || cart.customer_email).toLowerCase();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `Argora Cart Recovery <${fromEmail}>`,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error('❌ Failed to send email via Resend:', emailError);
      console.error('❌ Error details:', JSON.stringify(emailError, null, 2));

      // Check if it's a sandbox/verification error
      if (emailError.message && emailError.message.includes('verify a domain')) {
        return NextResponse.json(
          {
            error: 'Email sending is in test mode. Please use the verified email address from your Resend account, or contact support to enable production email sending.',
            details: emailError
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      );
    }

    console.log('✅ Email sent:', emailData);

    // Update cart in database with email tracking
    const updateData: Record<string, string | number> = {
      emails_sent: emailNumber,
      last_email_sent_at: new Date().toISOString(),
    };

    // Update specific email timestamp
    if (emailNumber === 1) {
      updateData.first_email_sent_at = new Date().toISOString();
      updateData.status = 'recovering'; // Change status to recovering on first email
    } else if (emailNumber === 2) {
      updateData.second_email_sent_at = new Date().toISOString();
    } else if (emailNumber === 3) {
      updateData.third_email_sent_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('abandoned_carts')
      .update(updateData)
      .eq('id', cartId);

    if (updateError) {
      console.error('Failed to update cart:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: `Email ${emailNumber} sent successfully`,
      emailId: emailData?.id,
    });
  } catch (error) {
    console.error('❌ Email service error:', error);

    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

interface CartItem {
  title: string;
  quantity: number;
  price: string;
}

interface MerchantSettings {
  discount_code_1?: string;
  discount_percentage_1?: number;
  discount_code_2?: string;
  discount_percentage_2?: number;
  discount_code_3?: string;
  discount_percentage_3?: number;
}

interface Store {
  store_name?: string;
  merchant_id?: string;
}

interface Cart {
  line_items?: CartItem[];
  cart_value: number;
  customer_first_name?: string;
  stores?: Store;
  abandoned_checkout_url: string;
}

/**
 * Generate personalized email content using AI
 */
async function generateEmailContent(
  cart: Cart,
  emailNumber: number,
  anthropic: Anthropic,
  merchantSettings: MerchantSettings | null
): Promise<{ subject: string; html: string }> {
  const productsList = cart.line_items
    ?.map(
      (item) =>
        `- ${item.title} (Quantity: ${item.quantity}, Price: $${item.price})`
    )
    .join('\n') || 'No items found';

  const totalValue = `$${cart.cart_value.toFixed(2)}`;
  const customerName = cart.customer_first_name || 'there';
  const storeName = cart.stores?.store_name || 'our store';
  const recoveryUrl = `${cart.abandoned_checkout_url}?utm_source=argora&utm_medium=email&utm_campaign=cart_recovery_${emailNumber}`;

  // Get merchant's discount code settings
  const discountCode1 = merchantSettings?.discount_code_1;
  const discountPercentage1 = merchantSettings?.discount_percentage_1;
  const discountCode2 = merchantSettings?.discount_code_2;
  const discountPercentage2 = merchantSettings?.discount_percentage_2;
  const discountCode3 = merchantSettings?.discount_code_3 || 'COMEBACK10';
  const discountPercentage3 = merchantSettings?.discount_percentage_3 || 10;

  // Different prompts for each email in the sequence
  let prompt = '';

  if (emailNumber === 1) {
    const hasDiscount = discountCode1 && discountPercentage1;
    prompt = `Create a friendly, helpful cart recovery email (Email 1 of 3-email sequence).

Customer: ${customerName}
Store: ${storeName}
Cart Value: ${totalValue}
Products:
${productsList}
${hasDiscount ? `\nDISCOUNT: Include discount code "${discountCode1}" for ${discountPercentage1}% off` : ''}

TONE: Gentle reminder, helpful, non-pushy
GOAL: Remind them they left items, offer help if they have questions
LENGTH: Short and sweet (3-4 paragraphs max)
${hasDiscount ? 'INCLUDE: Mention the discount code naturally in the email' : ''}

Return JSON with:
{
  "subject": "subject line that creates curiosity without being spammy${hasDiscount ? ', may mention discount' : ''}",
  "body": "email body in plain text with paragraphs separated by \\n\\n${hasDiscount ? ', include discount code' : ''}"
}`;
  } else if (emailNumber === 2) {
    const hasDiscount = discountCode2 && discountPercentage2;
    prompt = `Create an urgent cart recovery email (Email 2 of 3-email sequence).

Customer: ${customerName}
Store: ${storeName}
Cart Value: ${totalValue}
Products:
${productsList}
${hasDiscount ? `\nDISCOUNT: Include discount code "${discountCode2}" for ${discountPercentage2}% off` : ''}

TONE: More urgent, highlight scarcity/popularity, still friendly
GOAL: Create FOMO (fear of missing out), mention items may sell out
LENGTH: Medium (4-5 paragraphs)
${hasDiscount ? 'INCLUDE: Mention the discount code to sweeten the deal' : ''}

Return JSON with:
{
  "subject": "subject line that creates urgency${hasDiscount ? ', may mention discount' : ''}",
  "body": "email body in plain text with paragraphs separated by \\n\\n${hasDiscount ? ', include discount code' : ''}"
}`;
  } else {
    prompt = `Create a final cart recovery email with incentive (Email 3 of 3-email sequence).

Customer: ${customerName}
Store: ${storeName}
Cart Value: ${totalValue}
Products:
${productsList}

TONE: Last chance, offer ${discountPercentage3}% discount code "${discountCode3}", friendly but final
GOAL: Give them a reason to complete the purchase NOW with discount
LENGTH: Medium (4-5 paragraphs)
INCLUDE: Discount code "${discountCode3}" for ${discountPercentage3}% off

Return JSON with:
{
  "subject": "subject line mentioning special offer/discount",
  "body": "email body in plain text with paragraphs separated by \\n\\n, include discount code"
}`;
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const emailData = JSON.parse(responseText);

  // Convert plain text body to HTML
  const htmlBody = emailData.body
    .split('\n\n')
    .map((paragraph: string) => `<p>${paragraph}</p>`)
    .join('\n');

  const html = createEmailTemplate(
    customerName,
    htmlBody,
    recoveryUrl,
    storeName,
    productsList,
    totalValue
  );

  return {
    subject: emailData.subject,
    html,
  };
}

/**
 * Create HTML email template with Argora branding
 */
function createEmailTemplate(
  customerName: string,
  bodyContent: string,
  recoveryUrl: string,
  storeName: string,
  productsList: string,
  totalValue: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Purchase</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ${storeName}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                ${bodyContent}
              </div>
            </td>
          </tr>

          <!-- Cart Items -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Your Cart</h3>
                <div style="color: #666; font-size: 14px; line-height: 1.8; white-space: pre-line;">
                  ${productsList.replace(/- /g, '• ')}
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                  <strong style="color: #333; font-size: 16px;">Total: ${totalValue}</strong>
                </div>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="${recoveryUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Complete Your Purchase
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Powered by <strong style="color: #667eea;">Argora</strong> Cart Recovery
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                You're receiving this because you started a checkout at ${storeName}.
              </p>
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
