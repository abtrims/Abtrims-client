import { format } from "date-fns";
import { IOrder } from "@/types/order.types";
import { ISiteSetting } from "@/types/siteSetting.types";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// "৳990" for whole amounts, "৳990.50" otherwise
const money = (value: number) => {
  const amount = value || 0;
  return `৳${amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  mfs: "Mobile Banking",
  other: "Other",
  cod: "Cash on Delivery",
  sslcommerz: "Online Payment",
  bkash: "bKash",
};

interface ProductAttribute {
  name: string;
  values: string[];
}

// Order items carry the full product and variant rows from the API
type InvoiceItem = Omit<IOrder["items"][number], "product" | "productVariant"> & {
  product?: {
    name: string;
    images: string[];
    sku?: string | null;
    attributes?: ProductAttribute[] | null;
  } | null;
  productVariant?: {
    combination: string;
    sku?: string | null;
  } | null;
};

// A combination is the attribute values joined with "-" in attribute order
// ("30-56 (Free Size)-Chocolate"). Values can contain "-" themselves, so match
// each attribute's known values instead of splitting on "-".
const splitCombination = (
  combination: string,
  attributes: ProductAttribute[],
): Record<string, string> | null => {
  const result: Record<string, string> = {};
  let rest = combination.trim();
  for (const [i, attr] of attributes.entries()) {
    const isLast = i === attributes.length - 1;
    const lower = rest.toLowerCase();
    const value = [...(attr.values ?? [])]
      .sort((a, b) => b.length - a.length)
      .find((v) =>
        isLast
          ? lower === v.toLowerCase()
          : lower.startsWith(`${v.toLowerCase()}-`),
      );
    if (!value) return null;
    result[attr.name] = rest.slice(0, value.length);
    rest = rest.slice(value.length + 1);
  }
  return result;
};

// Invoice: full prices and totals. Challan: the delivery note that travels
// with the parcel, same layout but quantities only (no prices).
type PrintKind = "invoice" | "challan";

const buildInvoiceHtml = (
  order: IOrder,
  site: ISiteSetting | null | undefined,
  kind: PrintKind,
) => {
  const isChallan = kind === "challan";
  const siteName = site?.siteName || "AB Trims";
  const items = (order.items ?? []) as unknown as InvoiceItem[];
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * (item.quantity - item.returnedQuantity),
    0,
  );
  const email = order.email || order.user?.email;
  const paymentMethod = order.paymentMethod
    ? PAYMENT_METHOD_LABELS[order.paymentMethod.toLowerCase()] ??
      order.paymentMethod
    : null;
  // The zone itself isn't stored on the order; the district decides it
  const shippingArea =
    order.orderType === "POS"
      ? "In-store"
      : order.district
        ? /^dhaka$/i.test(order.district.trim())
          ? "Inside Dhaka"
          : "Outside Dhaka"
        : null;
  const website = typeof window !== "undefined" ? window.location.host : "";

  // One column per attribute name (Size, Color, ...). A variant whose values
  // can't be matched falls back to a single "Variant" column.
  const rows = items.map((item) => {
    const attributes = (item.product?.attributes ?? []).filter((a) => a?.name);
    const combination = item.productVariant?.combination;
    const parts =
      combination && attributes.length
        ? splitCombination(combination, attributes)
        : null;
    return { item, parts, fallback: combination && !parts ? combination : null };
  });
  const attributeColumns = Array.from(
    new Set(rows.flatMap((r) => (r.parts ? Object.keys(r.parts) : []))),
  );
  const hasFallback = rows.some((r) => r.fallback);

  const totalQty = items.reduce(
    (sum, item) => sum + item.quantity - item.returnedQuantity,
    0,
  );

  const bodyRows = rows
    .map(({ item, parts, fallback }) => {
      const keptQty = item.quantity - item.returnedQuantity;
      const code = item.productVariant?.sku || item.product?.sku;
      return `
        <tr>
          <td>
            <div>${escapeHtml(item.product?.name ?? "Deleted product")}</div>
            ${code ? `<div class="muted">(Code: ${escapeHtml(code)})</div>` : ""}
            ${item.returnedQuantity > 0 ? `<div class="returned">${item.returnedQuantity} returned</div>` : ""}
          </td>
          ${attributeColumns.map((col) => `<td>${escapeHtml(parts?.[col] ?? "")}</td>`).join("")}
          ${hasFallback ? `<td>${escapeHtml(fallback ?? "")}</td>` : ""}
          <td class="center">${keptQty}</td>
          ${isChallan ? "" : `<td>${money(item.price)}</td>
          <td>${money(item.price * keptQty)}</td>`}
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${isChallan ? "Challan" : "Invoice"} ${escapeHtml(order.orderNumber || order.id)}</title>
<style>
  /* No page margin = no room for the browser's own header/footer
     (date, title, URL, page number); the spacing lives in .page instead */
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, "Helvetica Neue", "Noto Sans Bengali", sans-serif;
    font-size: 12px;
    line-height: 1.45;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    padding: 16mm 18mm;
    /* Repeat the padding on every printed page of a long order */
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-bottom: 14px; border-bottom: 2px solid #111; }
  .logo { max-width: 110px; max-height: 70px; object-fit: contain; }
  .logo-text { font-size: 22px; font-weight: 800; }
  .company { text-align: right; }
  .company .name { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
  h1 { font-size: 26px; margin: 26px 0 14px; letter-spacing: 0.5px; }
  .info { display: flex; justify-content: space-between; gap: 24px; }
  .info > div > div { margin-bottom: 3px; }
  table { border-collapse: collapse; }
  table.items { width: 100%; margin-top: 24px; }
  table.items th, table.items td { border: 1px solid #ddd; padding: 9px 8px; text-align: left; vertical-align: middle; }
  table.items th { font-weight: 700; }
  table.items tr { page-break-inside: avoid; }
  .muted { color: #555; }
  .returned { color: #c00; font-size: 11px; }
  .center { text-align: center !important; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-top: 18px; }
  .note { max-width: 340px; white-space: pre-line; }
  table.totals { width: 42%; margin-left: auto; }
  table.totals td { border: 1px solid #ddd; padding: 8px; }
  table.totals td:first-child { width: 60%; }
  table.totals tr.grand td { border-top: 2px solid #111; font-weight: 700; font-size: 14px; }
  .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #333; line-height: 1.6; }
  .heart { color: #e11d48; }
  table.items tfoot td { font-weight: 700; }
  .signatures { display: flex; justify-content: space-between; gap: 48px; margin-top: 64px; }
  .signatures div { flex: 1; max-width: 200px; border-top: 1px solid #111; padding-top: 6px; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      ${site?.logo ? `<img class="logo" src="${escapeHtml(site.logo)}" alt="${escapeHtml(siteName)}" />` : `<div class="logo-text">${escapeHtml(siteName)}</div>`}
    </div>
    <div class="company">
      <div class="name">${escapeHtml(siteName)}</div>
      ${site?.address ? `<div>${escapeHtml(site.address)}</div>` : ""}
      ${site?.phone ? `<div>Phone: ${escapeHtml(site.phone)}</div>` : ""}
      ${site?.email ? `<div>${escapeHtml(site.email)}</div>` : ""}
    </div>
  </div>

  <h1>${isChallan ? "DELIVERY CHALLAN" : "INVOICE"}</h1>

  <div class="info">
    <div>
      <div><b>${isChallan ? "Deliver To" : "Bill To"}</b></div>
      <div>${escapeHtml(order.fullName || "Customer")}</div>
      ${order.address ? `<div>${escapeHtml([order.address, order.district].filter(Boolean).join(", "))}</div>` : ""}
      ${order.phone ? `<div>Phone: ${escapeHtml(order.phone)}</div>` : ""}
      ${email ? `<div>Email: ${escapeHtml(email)}</div>` : ""}
      ${order.notes ? `<div class="note"><b>Note:</b> ${escapeHtml(order.notes)}</div>` : ""}
    </div>
    <div>
      <div><b>${isChallan ? "Challan No" : "Invoice No"}:</b> ${escapeHtml(order.orderNumber || order.id)}</div>
      <div><b>${isChallan ? "Order Date" : "Date"}:</b> ${escapeHtml(format(new Date(order.createdAt), "d/M/yyyy"))}</div>
      ${isChallan ? `<div><b>Print Date:</b> ${escapeHtml(format(new Date(), "d/M/yyyy"))}</div>` : `<div><b>Payment:</b> ${paymentMethod ? `${escapeHtml(paymentMethod)} (${escapeHtml(order.paymentStatus.toLowerCase())})` : escapeHtml(order.paymentStatus.toLowerCase())}</div>`}
      ${shippingArea ? `<div><b>Shipping:</b> ${escapeHtml(shippingArea)}</div>` : ""}
    </div>
  </div>

  <table class="items">
    <thead>
      <tr>
        <th>Product</th>
        ${attributeColumns.map((col) => `<th>${escapeHtml(col)}</th>`).join("")}
        ${hasFallback ? "<th>Variant</th>" : ""}
        <th class="center" style="width:${isChallan ? 80 : 48}px">${isChallan ? "Quantity" : "Qty"}</th>
        ${isChallan ? "" : `<th style="width:80px">Unit Price</th>
        <th style="width:90px">Total</th>`}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    ${isChallan ? `<tfoot>
      <tr>
        <td colspan="${1 + attributeColumns.length + (hasFallback ? 1 : 0)}" style="text-align:right">Total Quantity</td>
        <td class="center">${totalQty}</td>
      </tr>
    </tfoot>` : ""}
  </table>

  <div class="bottom">
    <div></div>
    ${isChallan ? "" : `<table class="totals">
      <tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>
      <tr><td>Shipping</td><td>${money(order.shippingFee)}</td></tr>
      ${order.discountAmount > 0 ? `<tr><td>Discount</td><td>-${money(order.discountAmount)}</td></tr>` : ""}
      <tr class="grand"><td>Grand Total</td><td>${money(order.totalAmount)}</td></tr>
    </table>`}
  </div>

  ${isChallan ? `<div class="signatures">
    <div>Received By</div>
    <div>Authorized Signature</div>
  </div>` : ""}

  <div class="footer">
    <div>Thank you for shopping at ${escapeHtml(siteName.toUpperCase())} <span class="heart">&#10084;</span></div>
    ${website ? `<div>For Online Shopping: ${escapeHtml(website)}</div>` : ""}
  </div>
</div>
</body>
</html>`;
};

// Prints an A4 page from a hidden iframe, so the page's own print styles
// (80mm POS receipt, label sheet) don't apply to it.
const printHtml = (html: string) => {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!frameWindow || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    iframe.remove();
  };

  // Wait for the logo so it isn't missing from the printout (max 5s)
  const images = Array.from(doc.images);
  const imagesReady = Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
    ),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));

  void Promise.race([imagesReady, timeout]).then(() => {
    frameWindow.addEventListener("afterprint", cleanup);
    frameWindow.focus();
    frameWindow.print();
    // Fallback for browsers that don't fire afterprint
    setTimeout(cleanup, 60_000);
  });
};

export const printOrderInvoice = (order: IOrder, site?: ISiteSetting | null) =>
  printHtml(buildInvoiceHtml(order, site, "invoice"));

export const printOrderChallan = (order: IOrder, site?: ISiteSetting | null) =>
  printHtml(buildInvoiceHtml(order, site, "challan"));
