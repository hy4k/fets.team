// Minimal layout for print pages — no sidebar, no header
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FETS Document</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { background: white; }
          @media screen { body { background: #f0f0f0; } }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
