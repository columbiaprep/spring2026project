import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('📧 Email API route called');
  
  try {
    const body = await request.json();
    console.log('Request body received:', { to: body.to, subject: body.subject });
    
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;

    console.log('Mailgun config:', {
      domain: MAILGUN_DOMAIN,
      hasApiKey: !!MAILGUN_API_KEY
    });

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error('Mailgun credentials not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Mailgun API endpoint
    const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
    console.log('Mailgun URL:', url);

    // Create URLSearchParams for form data (Mailgun expects form-encoded data)
    const params = new URLSearchParams();
    params.append('from', `CGPS Portal <noreply@${MAILGUN_DOMAIN}>`);
    params.append('to', to);
    params.append('subject', subject);
    params.append('html', html);

    // Send email via Mailgun
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log('Mailgun response status:', response.status);
    console.log('Mailgun response:', responseText);

    if (!response.ok) {
      console.error('Mailgun error response:', responseText);
      return NextResponse.json(
        { error: 'Failed to send email', details: responseText },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);
    console.log('✅ Email sent successfully');
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}