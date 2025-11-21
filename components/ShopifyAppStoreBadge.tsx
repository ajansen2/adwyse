import Image from 'next/image';
import Link from 'next/link';

interface ShopifyAppStoreBadgeProps {
  variant?: 'preferred' | 'alternative';
  appUrl: string;
  className?: string;
  height?: number;
}

/**
 * Official Shopify App Store Badge component
 * Follows Shopify's brand guidelines for app marketing
 * @see https://shopify.dev/docs/apps/launch/marketing/shopify-brand-assets
 */
export default function ShopifyAppStoreBadge({
  variant = 'preferred',
  appUrl,
  className = '',
  height = 60
}: ShopifyAppStoreBadgeProps) {
  // Use SVG for crisp rendering at any size
  const badgeSvg = variant === 'preferred' ? (
    // Preferred: White on Black
    <svg
      width={height * 3.5}
      height={height}
      viewBox="0 0 280 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="280" height="80" rx="8" fill="#000000"/>

      {/* Shopify Logo */}
      <g transform="translate(20, 20)">
        <path
          d="M35.742 10.134c-0.032-0.224-0.224-0.32-0.384-0.32-0.16 0-3.04-0.064-3.04-0.064s-2.4-2.336-2.656-2.592c-0.256-0.256-0.768-0.192-0.96-0.128 0 0-0.48 0.16-1.28 0.416-0.096-0.288-0.224-0.64-0.416-1.024-0.608-1.248-1.536-1.92-2.688-1.92-0.064 0-0.16 0-0.224 0.032-0.032-0.064-0.096-0.096-0.16-0.16-0.48-0.512-1.088-0.768-1.856-0.768-2.88 0-4.288 3.616-4.736 5.44-1.344 0.416-2.304 0.704-2.4 0.736-0.704 0.224-0.736 0.256-0.832 0.928-0.064 0.512-1.824 14.08-1.824 14.08l13.888 2.656 6.016-1.504c0 0-1.824-12.256-1.856-12.544zm-7.136-1.088c-0.608 0.192-1.28 0.384-2.016 0.64 0-0.992-0.128-2.368-0.608-3.52 1.344 0.096 2.176 1.696 2.624 2.88zm-3.552-2.784c0.416 1.088 0.576 2.528 0.576 3.648-0.96 0.288-1.984 0.608-3.040 0.928 0.544-2.048 1.6-3.04 2.464-3.616 0 0.032 0 0.032 0 0.032zm-1.088-1.92c0.288 0 0.544 0.064 0.768 0.16-1.056 0.768-2.24 2.144-2.752 4.736-0.832 0.256-1.632 0.512-2.4 0.736 0.512-2.336 1.92-5.632 4.384-5.632z"
          fill="#95BF47"
        />
        <path
          d="M35.358 9.814c-0.16 0-3.04-0.064-3.04-0.064s-2.4-2.336-2.656-2.592c-0.096-0.096-0.224-0.16-0.384-0.192v22.4l6.016-1.504c0 0-1.824-12.256-1.856-12.544-0.032-0.224-0.224-0.32-0.384-0.32z"
          fill="#5E8E3E"
        />
        <path
          d="M24.642 14.078l-1.056 3.968c0 0-1.152-0.608-2.528-0.608-2.016 0-2.112 1.28-2.112 1.6 0 1.76 4.512 2.432 4.512 6.56 0 3.264-2.048 5.344-4.8 5.344-3.296 0-5.024-2.048-5.024-2.048l0.896-2.976c0 0 1.792 1.536 3.296 1.536 0.992 0 1.408-0.768 1.408-1.344 0-2.336-3.712-2.432-3.712-6.176 0-3.168 2.272-6.24 6.88-6.24 1.792 0 2.656 0.512 2.656 0.512z"
          fill="#FFFFFF"
        />
      </g>

      {/* Text: "Find it on the" */}
      <text
        x="75"
        y="28"
        fill="#FFFFFF"
        fontSize="11"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="400"
      >
        Find it on the
      </text>

      {/* Text: "Shopify App Store" */}
      <text
        x="75"
        y="52"
        fill="#FFFFFF"
        fontSize="16"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        Shopify App Store
      </text>
    </svg>
  ) : (
    // Alternative: Black on White
    <svg
      width={height * 3.5}
      height={height}
      viewBox="0 0 280 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="280" height="80" rx="8" fill="#FFFFFF" stroke="#000000" strokeWidth="2"/>

      {/* Shopify Logo */}
      <g transform="translate(20, 20)">
        <path
          d="M35.742 10.134c-0.032-0.224-0.224-0.32-0.384-0.32-0.16 0-3.04-0.064-3.04-0.064s-2.4-2.336-2.656-2.592c-0.256-0.256-0.768-0.192-0.96-0.128 0 0-0.48 0.16-1.28 0.416-0.096-0.288-0.224-0.64-0.416-1.024-0.608-1.248-1.536-1.92-2.688-1.92-0.064 0-0.16 0-0.224 0.032-0.032-0.064-0.096-0.096-0.16-0.16-0.48-0.512-1.088-0.768-1.856-0.768-2.88 0-4.288 3.616-4.736 5.44-1.344 0.416-2.304 0.704-2.4 0.736-0.704 0.224-0.736 0.256-0.832 0.928-0.064 0.512-1.824 14.08-1.824 14.08l13.888 2.656 6.016-1.504c0 0-1.824-12.256-1.856-12.544zm-7.136-1.088c-0.608 0.192-1.28 0.384-2.016 0.64 0-0.992-0.128-2.368-0.608-3.52 1.344 0.096 2.176 1.696 2.624 2.88zm-3.552-2.784c0.416 1.088 0.576 2.528 0.576 3.648-0.96 0.288-1.984 0.608-3.04 0.928 0.544-2.048 1.6-3.04 2.464-3.616 0 0.032 0 0.032 0 0.032zm-1.088-1.92c0.288 0 0.544 0.064 0.768 0.16-1.056 0.768-2.24 2.144-2.752 4.736-0.832 0.256-1.632 0.512-2.4 0.736 0.512-2.336 1.92-5.632 4.384-5.632z"
          fill="#95BF47"
        />
        <path
          d="M35.358 9.814c-0.16 0-3.04-0.064-3.04-0.064s-2.4-2.336-2.656-2.592c-0.096-0.096-0.224-0.16-0.384-0.192v22.4l6.016-1.504c0 0-1.824-12.256-1.856-12.544-0.032-0.224-0.224-0.32-0.384-0.32z"
          fill="#5E8E3E"
        />
        <path
          d="M24.642 14.078l-1.056 3.968c0 0-1.152-0.608-2.528-0.608-2.016 0-2.112 1.28-2.112 1.6 0 1.76 4.512 2.432 4.512 6.56 0 3.264-2.048 5.344-4.8 5.344-3.296 0-5.024-2.048-5.024-2.048l0.896-2.976c0 0 1.792 1.536 3.296 1.536 0.992 0 1.408-0.768 1.408-1.344 0-2.336-3.712-2.432-3.712-6.176 0-3.168 2.272-6.24 6.88-6.24 1.792 0 2.656 0.512 2.656 0.512z"
          fill="#000000"
        />
      </g>

      {/* Text: "Find it on the" */}
      <text
        x="75"
        y="28"
        fill="#000000"
        fontSize="11"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="400"
      >
        Find it on the
      </text>

      {/* Text: "Shopify App Store" */}
      <text
        x="75"
        y="52"
        fill="#000000"
        fontSize="16"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        Shopify App Store
      </text>
    </svg>
  );

  return (
    <Link
      href={appUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shopify-app-store-badge inline-block transition-transform hover:scale-105"
      style={{
        minHeight: `${height}px`,
        display: 'inline-block'
      }}
    >
      {badgeSvg}
    </Link>
  );
}
