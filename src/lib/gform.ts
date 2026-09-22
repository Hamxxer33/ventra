const FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSf10363fdC7U1I8pYbTeAEGkwDKBtSKfB40FInQE_rYzp8EcA/formResponse";

const ENTRY_WALLET = "entry.584099831";
const ENTRY_HANDLE = "entry.2653092";

export function submitWhitelistToGoogleForm(wallet: string, handle: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Form submit needs a browser"));
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.name = "ventra-gform";
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.action = FORM_ACTION;
    form.method = "POST";
    form.target = "ventra-gform";
    form.style.display = "none";

    const fields: Record<string, string> = {
      [ENTRY_WALLET]: wallet,
      [ENTRY_HANDLE]: handle,
    };
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.append(iframe, form);
    form.submit();

    window.setTimeout(() => {
      form.remove();
      iframe.remove();
      resolve();
    }, 900);
  });
}
