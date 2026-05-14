// Thermal printer receipt generator (58mm/80mm compatible)
// Works via browser print dialog → any USB/Bluetooth/Wi-Fi thermal printer
// installed as a system printer on the device viewing the admin.

import type { CustomerOrder } from '@/hooks/useCustomerOrders';

interface PrintOptions {
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  width?: '58mm' | '80mm';
  copies?: number;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function buildReceiptHTML(order: CustomerOrder, opts: PrintOptions = {}) {
  const width = opts.width ?? '80mm';
  const storeName = opts.storeName ?? 'ZEBRAI DRINKS';
  const storePhone = opts.storePhone ?? '41 98429-6633';
  const storeAddress = opts.storeAddress ?? 'Rua Monte Sinai 38 - Costeira - SJP';

  const date = new Date(order.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHTML = (order.items ?? [])
    .map(
      (i) => `
      <tr>
        <td class="qty">${i.quantity}x</td>
        <td class="name">${escapeHtml(i.product_name)}${i.mixer ? `<br><span class="mixer">+ ${escapeHtml(i.mixer)}</span>` : ''}</td>
        <td class="price">${fmt(i.total)}</td>
      </tr>`
    )
    .join('');

  const subtotal = (order.items ?? []).reduce((s, i) => s + Number(i.total), 0);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Pedido ${order.id.substring(0, 8)}</title>
<style>
  @page { size: ${width} auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: 'Courier New', monospace;
    color: #000; background: #fff;
    font-size: 12px; line-height: 1.35;
  }
  .receipt { width: ${width}; padding: 6px 8px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .big { font-size: 16px; font-weight: bold; }
  .xl { font-size: 20px; font-weight: bold; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; font-size: 12px; }
  td.qty { width: 28px; font-weight: bold; }
  td.price { text-align: right; white-space: nowrap; }
  .mixer { font-size: 10px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
  .total-box { font-size: 18px; font-weight: bold; text-align: right; padding: 4px 0; }
  .footer { font-size: 10px; text-align: center; margin-top: 8px; }
  .badge { border: 2px solid #000; padding: 4px 6px; display: inline-block; font-weight: bold; margin: 4px 0; }
</style>
</head>
<body>
<div class="receipt">
  <div class="center xl">${escapeHtml(storeName)}</div>
  <div class="center" style="font-size:10px">${escapeHtml(storeAddress)}</div>
  <div class="center" style="font-size:10px">Tel: ${escapeHtml(storePhone)}</div>
  <div class="hr"></div>

  <div class="center bold">PEDIDO #${order.id.substring(0, 8).toUpperCase()}</div>
  <div class="center" style="font-size:10px">${date}</div>
  <div class="hr"></div>

  <div class="label">Cliente</div>
  <div class="bold">${escapeHtml(order.customer_name)}</div>
  ${order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : ''}
  ${order.customer_address ? `<div style="margin-top:2px"><span class="label">Endereço:</span><br>${escapeHtml(order.customer_address)}</div>` : '<div class="badge">RETIRADA NO LOCAL</div>'}
  <div class="hr"></div>

  <div class="label">Itens</div>
  <table>${itemsHTML}</table>
  <div class="hr"></div>

  <div class="row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
  ${order.delivery_fee > 0 ? `<div class="row"><span>Taxa entrega</span><span>${fmt(order.delivery_fee)}</span></div>` : ''}
  <div class="hr"></div>
  <div class="total-box">TOTAL: ${fmt(order.total)}</div>

  ${order.notes ? `<div class="hr"></div><div class="label">Observações</div><div>${escapeHtml(order.notes)}</div>` : ''}

  <div class="hr"></div>
  <div class="footer">
    Obrigado pela preferência!<br>
    ${escapeHtml(storeName)}
  </div>
  <div style="height: 30px"></div>
</div>
<script>
  window.addEventListener('load', () => {
    setTimeout(() => { window.focus(); window.print(); }, 100);
  });
</script>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printOrderReceipt(order: CustomerOrder, opts: PrintOptions = {}) {
  const html = buildReceiptHTML(order, opts);

  // Hidden iframe approach — avoids popup blockers
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  // Cleanup after print dialog closes
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch {}
  }, 60_000);
}

const AUTO_PRINT_KEY = 'zebrai_auto_print_v1';
const PRINT_WIDTH_KEY = 'zebrai_print_width_v1';
const PRINTED_ORDERS_KEY = 'zebrai_printed_orders_v1';

export const printPrefs = {
  getAutoPrint(): boolean {
    return localStorage.getItem(AUTO_PRINT_KEY) === '1';
  },
  setAutoPrint(v: boolean) {
    localStorage.setItem(AUTO_PRINT_KEY, v ? '1' : '0');
  },
  getWidth(): '58mm' | '80mm' {
    return (localStorage.getItem(PRINT_WIDTH_KEY) as '58mm' | '80mm') || '80mm';
  },
  setWidth(w: '58mm' | '80mm') {
    localStorage.setItem(PRINT_WIDTH_KEY, w);
  },
  wasPrinted(orderId: string): boolean {
    try {
      const arr = JSON.parse(localStorage.getItem(PRINTED_ORDERS_KEY) || '[]');
      return arr.includes(orderId);
    } catch {
      return false;
    }
  },
  markPrinted(orderId: string) {
    try {
      const arr: string[] = JSON.parse(localStorage.getItem(PRINTED_ORDERS_KEY) || '[]');
      if (!arr.includes(orderId)) arr.push(orderId);
      // Keep last 200
      const trimmed = arr.slice(-200);
      localStorage.setItem(PRINTED_ORDERS_KEY, JSON.stringify(trimmed));
    } catch {
      return false;
    }
  },
};
