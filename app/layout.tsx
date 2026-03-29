import type { Metadata } from 'next';
import './globals.css';

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '?';

export const metadata: Metadata = {
  title: `Entropy v${appVersion} — Software Complexity Simulation`,
  description: 'Watch software entropy compound over a simulated 5-year horizon. Visualizes how growing codebases accumulate complexity until maintenance costs exceed value delivered.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
