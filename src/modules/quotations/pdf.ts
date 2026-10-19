import PDFDocument from "pdfkit";
import type { QuotationDetail } from "./types.js";

const PAGE_MARGIN = 48;
const FOOTER_SPACE = 42;
const CONTENT_WIDTH = 499;
const COLORS = {
  ink: "#172033",
  muted: "#64748b",
  accent: "#2563eb",
  line: "#e2e8f0",
};

function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount)}`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Makassar" }).format(date);
}

function billingPeriod(value: string | null): string {
  if (!value) return "";
  return ({ MONTHLY: "Bulanan", YEARLY: "Tahunan", ONE_TIME: "Sekali bayar" } as const)[value as "MONTHLY" | "YEARLY" | "ONE_TIME"];
}

function safeText(value: string): string {
  // PDFKit's built-in fonts cover WinAnsi. Replace unsupported symbols without losing readable text.
  return value.replace(/[^\u0000-\u00ff]/g, "?");
}

export async function createQuotationPdf(quotation: QuotationDetail): Promise<Buffer> {
  const document = new PDFDocument({
    size: "A4",
    margins: { top: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN + FOOTER_SPACE, left: PAGE_MARGIN },
    bufferPages: true,
    compress: false,
    info: { Title: `Quotation ${quotation.header.quotationNumber}`, Subject: quotation.header.projectName },
  });
  const chunks: Buffer[] = [];
  const output = new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  const ensureSpace = (height: number) => {
    if (document.y + height > document.page.height - document.page.margins.bottom) document.addPage();
  };
  const section = (title: string) => {
    ensureSpace(36);
    document.moveDown(0.7);
    document.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.accent).text(safeText(title.toUpperCase()));
    document.moveDown(0.35);
  };
  const detailRow = (label: string, value: string, options: { emphasis?: boolean } = {}) => {
    const labelWidth = 145;
    const valueWidth = CONTENT_WIDTH - labelWidth;
    const safeValue = safeText(value || "-");
    const valueHeight = document.font(options.emphasis ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).heightOfString(safeValue, { width: valueWidth });
    const rowHeight = Math.max(18, valueHeight + 8);
    ensureSpace(rowHeight + 2);
    const y = document.y;
    document.font("Helvetica").fontSize(9).fillColor(COLORS.muted).text(safeText(label), PAGE_MARGIN, y, { width: labelWidth - 10 });
    document.font(options.emphasis ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).fillColor(COLORS.ink)
      .text(safeValue, PAGE_MARGIN + labelWidth, y, { width: valueWidth });
    document.y = y + rowHeight;
    document.moveTo(PAGE_MARGIN, document.y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, document.y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
    document.moveDown(0.18);
  };

  document.rect(PAGE_MARGIN, PAGE_MARGIN, 42, 42).fill(COLORS.accent);
  document.font("Helvetica-Bold").fontSize(14).fillColor("#ffffff")
    .text(safeText(quotation.header.projectName.trim().slice(0, 1).toUpperCase() || "Q"), PAGE_MARGIN, PAGE_MARGIN + 13, { width: 42, align: "center" });
  document.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.ink)
    .text("QUOTATION", PAGE_MARGIN + 56, PAGE_MARGIN + 1, { width: CONTENT_WIDTH - 56, align: "right" });
  document.font("Helvetica").fontSize(10).fillColor(COLORS.muted)
    .text(`${quotation.header.quotationNumber}  |  Versi ${quotation.header.version}  |  ${quotation.header.status}`, PAGE_MARGIN + 56, PAGE_MARGIN + 31, { width: CONTENT_WIDTH - 56, align: "right" });
  document.y = PAGE_MARGIN + 61;
  document.moveTo(PAGE_MARGIN, document.y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, document.y).strokeColor(COLORS.accent).lineWidth(1.5).stroke();
  document.moveDown(0.8);

  section("Informasi Klien dan Project");
  detailRow("Klien", quotation.header.clientName);
  detailRow("Project", quotation.header.projectName);
  detailRow("Tanggal quotation", formatDate(quotation.header.createdAt));
  if (quotation.header.deadline) detailRow("Deadline", formatDate(quotation.header.deadline));
  if (quotation.header.logoUrl) detailRow("Logo project", "Tersimpan pada snapshot project");

  section("Rincian Pekerjaan");
  if (quotation.features.length === 0) detailRow("Fitur", "Tidak ada fitur pada snapshot");
  for (const feature of quotation.features) {
    detailRow(feature.name, `${feature.estimatedHours} jam  |  ${formatRupiah(feature.developmentCost)}`, { emphasis: true });
    for (const selection of feature.selections) {
      detailRow(`  ${selection.optionName}`, `${selection.valueLabel} (+${selection.hours} jam)`);
    }
  }
  if (quotation.design) detailRow("Design", `${quotation.design.name}  |  ${formatRupiah(quotation.design.price)}`);
  for (const hosting of quotation.hostings) {
    const name = [hosting.label, hosting.provider, hosting.plan].filter(Boolean).join(" - ");
    const price = hosting.clientProvided ? "Disediakan klien" : formatRupiah(hosting.clientPrice);
    const period = billingPeriod(hosting.billingPeriod);
    detailRow("Hosting", `${name}  |  ${price}${period ? ` / ${period}` : ""}`);
  }
  for (const maintenance of quotation.maintenances) {
    detailRow("Maintenance", `${maintenance.name}  |  ${formatRupiah(maintenance.price)} / ${billingPeriod(maintenance.billingPeriod)}`);
  }

  section("Estimasi Waktu");
  detailRow("Estimasi development", `${quotation.timeline.estimatedHours} jam`);
  detailRow("Buffer", `${quotation.timeline.bufferPercentage}%  |  ${quotation.timeline.bufferedHours} jam setelah buffer`);
  detailRow("Durasi kerja", `${quotation.timeline.workingDays} hari kerja (${quotation.timeline.workingHoursPerDay} jam per hari)`);

  section("Ringkasan Biaya");
  detailRow("Biaya development", formatRupiah(quotation.pricing.developmentCost));
  detailRow("Biaya design", formatRupiah(quotation.pricing.designCost));
  detailRow("Biaya hosting", formatRupiah(quotation.pricing.hostingCost));
  detailRow("Biaya maintenance", formatRupiah(quotation.pricing.maintenanceCost));
  detailRow("Subtotal", formatRupiah(quotation.pricing.subtotal), { emphasis: true });
  detailRow(`Margin (${quotation.pricing.marginPercentage}%)`, formatRupiah(quotation.pricing.marginAmount));
  if (quotation.pricing.rushFeeAmount > 0 || quotation.pricing.rushFeePercentage > 0) {
    detailRow(`Rush fee (${quotation.pricing.rushFeePercentage}%)`, formatRupiah(quotation.pricing.rushFeeAmount));
  }
  detailRow("TOTAL", formatRupiah(quotation.pricing.finalPrice), { emphasis: true });

  section("Kebijakan Revisi");
  detailRow("Revisi gratis", `${quotation.revisionPolicy.freeRevisionCount} kali`);
  detailRow("Revisi tambahan", formatRupiah(quotation.revisionPolicy.additionalRevisionPrice));

  const pages = document.bufferedPageRange();
  for (let page = pages.start; page < pages.start + pages.count; page += 1) {
    document.switchToPage(page);
    const y = document.page.height - PAGE_MARGIN - 18;
    document.moveTo(PAGE_MARGIN, y - 8).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y - 8).strokeColor(COLORS.line).lineWidth(0.5).stroke();
    document.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
      .text(`Itungitungan  |  ${quotation.header.quotationNumber}`, PAGE_MARGIN, y, { width: CONTENT_WIDTH / 2, lineBreak: false });
    document.text(`${page - pages.start + 1} / ${pages.count}`, PAGE_MARGIN + CONTENT_WIDTH / 2, y, { width: CONTENT_WIDTH / 2, align: "right", lineBreak: false });
  }

  document.end();
  return output;
}

export function quotationPdfFilename(quotationNumber: string, version: number): string {
  const safeNumber = quotationNumber.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "quotation";
  const safeVersion = Number.isSafeInteger(version) && version > 0 ? version : 1;
  return `quotation-${safeNumber}-v${safeVersion}.pdf`;
}
