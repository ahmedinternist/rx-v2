import type { ReactNode } from 'react';

export const metadata = {
  title: 'Rx Viewer',
  description: 'Digital Prescription Gateway',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
