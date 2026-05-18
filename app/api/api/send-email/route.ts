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

    console.log('Environment check:', {
      domain: MAILGUN_DOMAIN || 'MISSING',
      hasApiKey: !!MAILGUN_API_KEY,
      nodeEnv: process.env.NODE_ENV
    });

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error('❌ Mailgun credentials not configured!');
      console.error('Make sure you have .env.local with:');
      console.error('MAILGUN_API_KEY=your_key');
      console.error('MAILGUN_DOMAIN=your_domain');
      return NextResponse.json(
        { error: 'Email service not configured - check server logs' },
        { status: 500 }
      );
    }

    const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
    console.log('Mailgun URL:', url);

    const params = new URLSearchParams();
    params.append('from', `CGPS Portal <noreply@${MAILGUN_DOMAIN}>`);
    params.append('to', to);
    params.append('subject', subject);
    params.append('html', html);

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

// Add GET handler to help with debugging
export async function GET() {
  return NextResponse.json({ 
    message: 'Email API is running. Use POST to send emails.',
    requiredFields: ['to', 'subject', 'html'],
    envCheck: {
      hasMailgunKey: !!process.env.MAILGUN_API_KEY,
      hasMailgunDomain: !!process.env.MAILGUN_DOMAIN,
      domain: process.env.MAILGUN_DOMAIN || 'NOT SET'
    }
  });
}