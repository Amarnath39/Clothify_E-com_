import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phoneNumber, otpCode, apiKey } = await request.json();
    
    const response = await fetch(
      `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY3/${phoneNumber}/${otpCode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}