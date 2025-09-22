import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/libs/resend";
import { sendBookingConfirmationEmail } from "@/server/emails/bookings";
import type { BookingRecord } from "@/server/bookings";

export async function POST(req: NextRequest) {
  try {
    const { type, email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (type === "simple") {
      // Test simple email sending
      await sendEmail({
        to: email,
        subject: "Test Email from SajiloReserveX",
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

      return NextResponse.json({
        success: true,
        message: "Simple test email sent successfully",
      });
    } else if (type === "booking") {
      // Test booking confirmation email with mock data
      const mockBooking: BookingRecord = {
        id: "test-booking-id",
        reference: "TEST123",
        restaurant_id: "mock-restaurant-id",
        table_id: "mock-table-id",
        booking_date: "2025-09-25",
        start_time: "19:00",
        end_time: "21:00",
        party_size: 2,
        booking_type: "dining",
        seating_preference: "any",
        status: "confirmed",
        customer_name: "Test Customer",
        customer_email: email,
        customer_phone: "+1234567890",
        notes: "Test booking for email verification",
        marketing_opt_in: false,
        loyalty_points_awarded: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sendBookingConfirmationEmail(mockBooking);

      return NextResponse.json({
        success: true,
        message: "Booking confirmation test email sent successfully",
        bookingReference: mockBooking.reference,
      });
    }

    return NextResponse.json(
      { error: "Invalid type. Use 'simple' or 'booking'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[test-email] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email test endpoint",
    usage: {
      method: "POST",
      body: {
        type: "'simple' | 'booking'",
        email: "recipient@example.com",
      },
    },
    examples: [
      {
        description: "Send simple test email",
        body: {
          type: "simple",
          email: "test@example.com",
        },
      },
      {
        description: "Send booking confirmation test email",
        body: {
          type: "booking",
          email: "test@example.com",
        },
      },
    ],
  });
}