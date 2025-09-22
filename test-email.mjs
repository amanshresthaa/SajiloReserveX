// Test script to verify email functionality
// Run with: node test-email.mjs

import { Resend } from 'resend';

const resend = new Resend('re_Uz8BxcHq_AMEMmBowMUnXsirwjLoxdfM5');

async function testEmailSending() {
  try {
    console.log('Testing Resend email sending...');
    
    const result = await resend.emails.send({
      from: 'SajiloReserveX <noreply@resend.adtechgrow.com>',
      to: 'aman@adtechgrow.com',
      subject: 'Test Email from SajiloReserveX',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Test Email</h1>
          <p>This is a test email to verify that Resend is configured correctly.</p>
          <p>If you receive this email, the integration is working!</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Test Email\n\nThis is a test email to verify that Resend is configured correctly.\n\nIf you receive this email, the integration is working!\n\nSent at: ${new Date().toISOString()}`,
    });

    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
    
    if (result.data?.id) {
      console.log(`📧 Email ID: ${result.data.id}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    if (error.message) {
      console.error('Error message:', error.message);
    }
    
    if (error.name) {
      console.error('Error type:', error.name);
    }
  }
}

testEmailSending();