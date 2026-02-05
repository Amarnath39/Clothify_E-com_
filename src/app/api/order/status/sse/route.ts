import { NextRequest } from "next/server";
import { sseClients } from "../../../../../lib/sseClients";

export const dynamic = "force-dynamic";

/**
 * ✅ SSE Endpoint for Order Status Updates
 * Allows frontend (like POS) to listen for payment confirmations in real-time.
 */
export async function GET(req: NextRequest) {
    const orderId = req.nextUrl.searchParams.get("orderId");

    if (!orderId) {
        return new Response("Missing orderId", { status: 400 });
    }

    console.log(`📡 New SSE connection request for order: ${orderId}`);

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Function to send data to the client
            const write = (data: string) => {
                try {
                    controller.enqueue(encoder.encode(data));
                } catch (err) {
                    console.error("SSE write error:", err);
                }
            };

            // Heartbeat to keep connection alive (optional, standard SSE usually needs it)
            const keepAlive = setInterval(() => {
                write(": keep-alive\n\n");
            }, 30000);

            // Register this client in the global map
            sseClients.set(orderId, {
                write,
                end: () => {
                    clearInterval(keepAlive);
                    try {
                        controller.close();
                    } catch (e) { }
                },
                pollTimer: keepAlive // Reuse the timer field for cleanup
            });

            // Cleanup when client disconnects
            req.signal.addEventListener("abort", () => {
                console.log(`📡 SSE client disconnected for order: ${orderId}`);
                clearInterval(keepAlive);
                sseClients.delete(orderId);
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
