import './globals.css';

export const metadata = {
  title: 'Agent Flow Harness',
  description: 'Agent workflow dashboard for code and creative automation runs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
