import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Potentia Ludi - Conversational Web3 Wallet Hub',
  description: 'Natural language powered Web3 wallet with intent-based transactions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
