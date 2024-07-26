import '../styles/globals.css';

export const metadata = {
  title: 'DiscLogger',
  description: 'A Discord Logger that logs your information',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
