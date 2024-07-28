import '../styles/globals.css';

export const metadata = {
  title: 'Discord Logger',
  description: 'A comprehensive tool for logging your information',
  keywords: 'Discord, Logger, Discord Bot, Server Management, Logging, Discord OAuth2',
  author: 'DiscLogger',
  viewport: 'width=device-width, initial-scale=1',
  og: {
    title: 'DiscLogger',
    type: 'website',
    url: 'https://disclogger.vercel.app',
    image: '/preview.png',
    description: 'A comprehensive tool for logging your information' // Added this to match your metadata
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content={metadata.viewport} />
        <meta name="description" content={metadata.description} />
        <meta name="keywords" content={metadata.keywords} />
        <meta name="author" content={metadata.author} />
        <meta name="theme-color" content="#6200ea" /> {/* Moved theme-color here */}
        <title>{metadata.title}</title>
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={metadata.og.title} />
        <meta property="og:type" content={metadata.og.type} />
        <meta property="og:url" content={metadata.og.url} />
        <meta property="og:image" content={metadata.og.image} />
        <meta property="og:description" content={metadata.og.description} />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
