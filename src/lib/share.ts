import { WL_URL } from "@/lib/drop";

export function tweetText(ticket: string): string {
  return `I just got whitelisted for the Ventra 10,000 NFT mint on OpenSea — ticket #${ticket}. Drops Sept 25. ${WL_URL}`;
}

export function tweetIntentUrl(ticket: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText(ticket))}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export type ShareResult = {
  openedIntent: boolean;
  downloaded: boolean;
  copied: boolean;
};

export async function shareCard(ticket: string, blob: Blob): Promise<ShareResult> {
  const file = new File([blob], `ventra-ticket-${ticket}.png`, { type: "image/png" });
  const text = tweetText(ticket);

  if (typeof navigator.canShare === "function") {
    try {
      if (navigator.canShare({ files: [file], text })) {
        await navigator.share({ files: [file], text, title: "Ventra" });
        return { openedIntent: false, downloaded: false, copied: false };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { openedIntent: false, downloaded: false, copied: false };
      }
    }
  }

  const copied = await copyImage(blob);
  downloadBlob(file, file.name);
  window.open(tweetIntentUrl(ticket), "_blank", "noopener,noreferrer");
  return { openedIntent: true, downloaded: true, copied };
}
