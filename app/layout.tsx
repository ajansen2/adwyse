import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Argora - AI-Powered Abandoned Cart Recovery for Shopify",
  description: "Recover $50K-200K annually from abandoned carts. AI-powered email campaigns for Shopify stores with 33% conversion rate.",
  keywords: "abandoned cart recovery, shopify cart recovery, shopify app, ecommerce automation, AI cart recovery, email recovery, cart abandonment solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || 'e84f4a7fecd1e8c9c05791a35c0336d4';
  
  return (
    <html lang="en">
      <head>
        {/* Shopify App Bridge - MUST be first script, synchronous, from CDN */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        {/* Shopify API key meta tag for App Bridge */}
        <meta name="shopify-api-key" content={apiKey} />
        {/* Initialize App Bridge with retry logic - waits for CDN to load */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            // Only initialize if embedded in Shopify (in iframe)
            if (window.self === window.top) {
              return; // Not embedded, skip
            }

            var retryCount = 0;
            var maxRetries = 50; // Try for ~5 seconds

            // Wait for window.shopify to be available with retry logic
            function initializeAppBridge() {
              if (window.shopify && window.shopify.createApp) {
                try {
                  var urlParams = new URLSearchParams(window.location.search);
                  var host = urlParams.get('host');
                  var shop = urlParams.get('shop');

                  if (host && shop) {
                    window.shopifyApp = window.shopify.createApp({
                      apiKey: '${apiKey}',
                      host: host,
                      forceRedirect: false
                    });
                    console.log('✅ App Bridge initialized from CDN (inline script after ' + retryCount + ' retries)');
                  }
                } catch (error) {
                  console.error('❌ Failed to initialize App Bridge:', error);
                }
              } else {
                retryCount++;
                if (retryCount < maxRetries) {
                  // Retry after a short delay
                  setTimeout(initializeAppBridge, 100);
                } else {
                  console.error('❌ Timed out waiting for Shopify App Bridge CDN to load');
                }
              }
            }

            // Start initialization attempt
            initializeAppBridge();
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
