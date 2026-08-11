// All email templates for Colony Bois — server-side only, never imported in client components

export type EmailType = "thank_you" | "receipt" | "greeting";

interface BaseParams {
  donorName: string;
  amount: number;
  paymentMethod: string;
  date: string;
  referenceId: string;
}

interface ReceiptParams extends BaseParams {
  collectorName?: string;
  verificationStatus: string;
}

// ── shared wrapper ────────────────────────────────────────────────────────────
function wrap(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Colony Bois</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#fff7ed;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;" cellspacing="0" cellpadding="0" border="0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#fed7aa;">Colony Bois · Rampuram</p>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;line-height:1.2;">🚩 Ganesh Chaturthi</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#ffedd5;">Vinayaka Chavithi Celebrations</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #fed7aa;border-right:1px solid #fed7aa;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fff7ed;border:1px solid #fed7aa;border-top:none;border-radius:0 0 16px 16px;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:16px;font-weight:900;color:#ea580c;">🙏 Ganpati Bappa Morya!</p>
              <p style="margin:0 0 4px;font-size:13px;color:#78716c;">❤️ One Colony. One Family. One Celebration.</p>
              <p style="margin:16px 0 0;font-size:11px;color:#a8a29e;">This email was sent by Colony Bois. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#78716c;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#1c1917;font-weight:500;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:20px 0;">
    <tbody>${rows}</tbody>
  </table>`;
}

// ── 1. Thank-you email ────────────────────────────────────────────────────────
export function thankYouEmail(p: BaseParams) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1c1917;">
      Dear ${p.donorName},
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#44403c;">
      Thank you for your generous contribution to the
      <strong style="color:#ea580c;">Colony Bois Vinayaka Chavithi celebrations</strong>.
      Your support helps us come together with devotion, tradition, unity, and community
      spirit to celebrate the festival of Lord Ganesha.
    </p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;">
      Donation Details
    </p>
    ${detailsTable(
      [
        row(
          "Contribution",
          `<strong style="color:#ea580c;">₹${p.amount.toLocaleString("en-IN")}</strong>`,
        ),
        row("Payment Method", p.paymentMethod),
        row("Date", p.date),
        row(
          "Reference",
          `<span style="font-family:monospace;font-size:12px;">${p.referenceId}</span>`,
        ),
      ].join(""),
    )}

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#44403c;">
      Wishing you and your family a joyful and blessed
      <strong style="color:#ea580c;">Vinayaka Chavithi</strong>. 🙏
    </p>
    <p style="margin:12px 0 0;font-size:15px;color:#44403c;">
      With gratitude,<br/>
      <strong style="font-size:16px;color:#1c1917;">Colony Bois</strong>
    </p>`;

  return {
    subject: "Thank You for Supporting Colony Bois 🙏",
    html: wrap(
      body,
      `Thank you for your ₹${p.amount.toLocaleString("en-IN")} contribution to Colony Bois Ganesh Chaturthi celebrations.`,
    ),
  };
}

// ── 2. Official receipt email ─────────────────────────────────────────────────
export function receiptEmail(p: ReceiptParams) {
  const rows = [
    row("Donor", p.donorName),
    row("Amount", `<strong style="color:#ea580c;">₹${p.amount.toLocaleString("en-IN")}</strong>`),
    row("Payment Method", p.paymentMethod),
    row("Date", p.date),
    row("Reference", `<span style="font-family:monospace;font-size:12px;">${p.referenceId}</span>`),
    p.collectorName ? row("Collected by", p.collectorName) : "",
    row("Status", `<span style="color:#16a34a;font-weight:700;">${p.verificationStatus}</span>`),
  ].join("");

  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1c1917;">
      Official Contribution Receipt
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#44403c;">
      Dear <strong>${p.donorName}</strong>, please find your official receipt for your
      contribution to the <strong style="color:#ea580c;">Colony Bois Vinayaka Chavithi</strong> celebrations.
    </p>

    <p style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;">
      Receipt Details
    </p>
    ${detailsTable(rows)}

    <p style="margin:24px 0 0;font-size:13px;color:#78716c;">
      Please keep this email as your official donation record. Thank you for your support.
    </p>
    <p style="margin:12px 0 0;font-size:15px;color:#44403c;">
      With gratitude,<br/>
      <strong style="font-size:16px;color:#1c1917;">Colony Bois</strong>
    </p>`;

  return {
    subject: "Colony Bois — Contribution Receipt 🙏",
    html: wrap(
      body,
      `Your official Colony Bois contribution receipt for ₹${p.amount.toLocaleString("en-IN")}.`,
    ),
  };
}

// ── 3. Vinayaka Chavithi greeting ─────────────────────────────────────────────
export function greetingEmail(donorName: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1c1917;">
      Dear ${donorName},
    </h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#44403c;">
      On behalf of the entire <strong style="color:#ea580c;">Colony Bois</strong> family,
      we wish you and your loved ones a very happy and blessed
      <strong style="color:#ea580c;">Vinayaka Chavithi!</strong> 🙏
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#44403c;">
      May <strong>Lord Ganesha</strong> — the remover of all obstacles, the bestower of
      wisdom and prosperity — bless your home with joy, peace, and good fortune.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#44403c;">
      Every year, our colony comes together with <strong>devotion, unity, creativity, and
      tradition</strong> to celebrate this beautiful festival. It is the love and support of
      generous friends like you that makes our Ganesh Mandapam shine brighter each year.
    </p>
    <div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:18px;font-weight:900;color:#ea580c;">🚩 Ganpati Bappa Morya!</p>
      <p style="margin:8px 0 0;font-size:14px;color:#78716c;">One Colony. One Family. One Celebration.</p>
    </div>
    <p style="margin:0;font-size:15px;color:#44403c;">
      With warmth &amp; devotion,<br/>
      <strong style="font-size:16px;color:#1c1917;">Colony Bois — SC Colony, Rampuram</strong>
    </p>`;

  return {
    subject: "Wishing You a Blessed Vinayaka Chavithi 🙏 — Colony Bois",
    html: wrap(
      body,
      "Wishing you and your family a very happy and blessed Vinayaka Chavithi from Colony Bois!",
    ),
  };
}
