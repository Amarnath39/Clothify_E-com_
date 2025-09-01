import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { phoneNumber, apiKey, var1Value } = await request.json();
    
    // Encode the var1 value to handle spaces and special characters
    const encodedVar1 = encodeURIComponent(var1Value);
    
    // Fixed URL with AUTOGEN included
    const response = await fetch(
      `https://2factor.in/API/V1/${apiKey}/SMS/+91${phoneNumber}/AUTOGEN/OTPlogin?var1=${encodedVar1}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}