import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

/**
 * Analytics slot. Everything is opt-in through env vars:
 *  NEXT_PUBLIC_VERCEL_ANALYTICS=1        → Vercel Web Analytics
 *  NEXT_PUBLIC_PLAUSIBLE_DOMAIN=site.com → Plausible
 *  NEXT_PUBLIC_TIKTOK_PIXEL_ID           → TikTok Pixel
 *  NEXT_PUBLIC_META_PIXEL_ID             → Meta (Facebook) Pixel
 * All scripts load `afterInteractive`/`lazyOnload` so they don't block rendering.
 */
export function Analytics() {
  const vercel = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS;
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const tiktok = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const meta = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const safe = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, "");

  return (
    <>
      {vercel && vercel !== "0" && vercel !== "false" && <VercelAnalytics />}
      {plausible && (
        <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
      )}
      {tiktok && (
        <Script id="tiktok-pixel" strategy="lazyOnload">
          {`!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${safe(tiktok)}');ttq.page();}(window, document, 'ttq');`}
        </Script>
      )}
      {meta && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${safe(meta)}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
