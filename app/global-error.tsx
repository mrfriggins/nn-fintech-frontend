"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#050505", color: "#00ff41", fontFamily: "monospace", padding: 32 }}>
        <h1 style={{ fontSize: 14, letterSpacing: 2, color: "#ef4444" }}>[ SYSTEM FAULT ]</h1>
        <p style={{ fontSize: 12, color: "#a1a1aa", maxWidth: 640 }}>
          {error.message || "The application shell failed to load."}
        </p>
        {error.digest && (
          <p style={{ fontSize: 10, color: "#52525b" }}>TRACE: {error.digest}</p>
        )}
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            fontSize: 12,
            background: "transparent",
            color: "#00ff41",
            border: "1px solid #15803d",
            cursor: "pointer",
          }}
        >
          RETRY
        </button>
      </body>
    </html>
  );
}
