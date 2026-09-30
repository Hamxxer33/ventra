import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import { CLAIM_DOMAIN, CLAIM_URL } from "@/lib/airdrop";

const APP_NAME = "Ventran ($VENT) Airdrop — claim.ventran.xyz";
const APP_DESCRIPTION =
  "Claim the Ventran ($VENT) airdrop on Arbitrum One. Official page: claim.ventran.xyz.";
/** Absolute OG image on the claim domain; ?v=2 cache-busts X card scrapes. */
const OG_IMAGE = `${CLAIM_URL}/og.jpg?v=2`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: `${APP_DESCRIPTION} Never share your seed phrase.`,
      },
      { name: "theme-color", content: "#f4f2ee" },
      // Open Graph / Twitter — platform middleware may re-stamp these from site.json;
      // keep them complete here so SSR and crawlers always see a clean card.
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${CLAIM_URL}/` },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: APP_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/vent-favicon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/vent-logo-192.png" },
    ],
  }),
  component: () => (
    <html lang="en" className="dark antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
