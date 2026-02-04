"use client";

/**
 * Debug page to check environment variables
 * Access: /admin/debug-env
 */
export default function DebugEnvPage() {
    const posEnabled = process.env.NEXT_PUBLIC_ENABLE_POS;

    return (
        <div style={{ padding: "2rem", fontFamily: "monospace" }}>
            <h1>Environment Variables Debug</h1>

            <div style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: posEnabled === "true" ? "#d4edda" : "#f8d7da",
                border: `2px solid ${posEnabled === "true" ? "#28a745" : "#dc3545"}`,
                borderRadius: "8px"
            }}>
                <h2>POS Feature Flag Status:</h2>
                <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    NEXT_PUBLIC_ENABLE_POS = {posEnabled || "undefined"}
                </p>

                {posEnabled === "true" ? (
                    <div style={{ color: "#155724", marginTop: "1rem" }}>
                        ✅ POS is ENABLED - Should be visible in sidebar
                    </div>
                ) : (
                    <div style={{ color: "#721c24", marginTop: "1rem" }}>
                        ❌ POS is DISABLED - Not visible in sidebar
                        <br />
                        <br />
                        <strong>Solution:</strong>
                        <ol style={{ marginTop: "0.5rem", textAlign: "left" }}>
                            <li>Set NEXT_PUBLIC_ENABLE_POS=true in your Docker build environment</li>
                            <li>Rebuild Docker image: <code>docker build -t app .</code></li>
                            <li>Restart container with new image</li>
                            <li>Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)</li>
                        </ol>
                    </div>
                )}
            </div>

            <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                <h3>All NEXT_PUBLIC_ Variables:</h3>
                <pre style={{ backgroundColor: "#fff", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
                    {JSON.stringify(
                        Object.keys(process.env)
                            .filter(key => key.startsWith("NEXT_PUBLIC_"))
                            .reduce((obj, key) => {
                                obj[key] = process.env[key];
                                return obj;
                            }, {} as Record<string, any>),
                        null,
                        2
                    )}
                </pre>
            </div>

            <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#fff3cd", borderRadius: "8px" }}>
                <h3>⚠️ Important Notes:</h3>
                <ul style={{ textAlign: "left" }}>
                    <li>NEXT_PUBLIC_ variables are embedded at <strong>build time</strong></li>
                    <li>Changing them requires a full rebuild</li>
                    <li>They cannot be changed at runtime</li>
                    <li>Clear browser cache after rebuild</li>
                </ul>
            </div>
        </div>
    );
}
