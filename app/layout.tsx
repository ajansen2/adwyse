import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CommandPalette } from "@/components/ui/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdWyse - Ad Attribution & ROAS Tracking for Shopify",
  description: "Track which Facebook, Google, and TikTok ads drive your Shopify sales. Real-time attribution, ROAS calculations, and AI-powered campaign insights.",
  keywords: "ad attribution, ROAS tracking, shopify analytics, facebook ads, google ads, tiktok ads, ecommerce attribution",
};

// Tracking IDs from environment variables
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '08fa8bc27e0e3ac857912c7e7ee289d0';

  return (
    <html lang="en">
      <head>
        {/* Facebook Pixel */}
        {FB_PIXEL_ID && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
          </>
        )}

        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
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
        <CommandPalette />
      </body>
    </html>
  );
}
