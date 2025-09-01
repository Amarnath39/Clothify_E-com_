import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        // Clear the token by setting the cookie with an expired date
        const response = NextResponse.json(
            { success: true, msg: "Logged out successfully" },
            { status: 200 }
        );

        response.cookies.set('token', '', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            expires: new Date(0), // Expire the cookie immediately
        });

        return response;
    } catch (error) {
        console.log("Error during logout", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};
