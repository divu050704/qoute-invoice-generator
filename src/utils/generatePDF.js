// generateInvoicePDF.js
import { Alert, Platform, PermissionsAndroid } from "react-native";
import { Image } from "react-native";
import { generateQuotationHTML } from './generateQuotationHTML';
export { generateQuotationHTML };

// Native modules – only available in custom native builds (expo run:android).
// Gracefully degrade if running in Expo Go.
let generatePDF = null;
let RNFS = null;
try {
  generatePDF = require('react-native-html-to-pdf').default?.generatePDF
    || require('react-native-html-to-pdf').generatePDF;
} catch (_) { generatePDF = null; }
try {
  const mod = require('react-native-fs');
  RNFS = mod.default || mod;
  if (typeof RNFS?.DocumentDirectoryPath !== 'string') RNFS = null;
} catch (_) { RNFS = null; }


const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    if (Platform.Version >= 33) return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        { title: "Storage Permission", message: "App needs access to storage to save PDF files", buttonNeutral: "Ask Me Later", buttonNegative: "Cancel", buttonPositive: "OK" }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) { console.warn("Permission error", err); return false; }
  }
  return true;
};

const uriToDataUri = async (uri) => {
  if (!uri) return null;
  if (uri.startsWith('data:')) return uri;
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) { console.warn('HTTP fetch for image failed', e); return uri; }
  }
  const normalized = uri.startsWith("file://") ? uri : `file://${uri}`;
  if (RNFS && RNFS.exists) {
    try {
      const path = normalized.replace("file://", "");
      const base64 = await RNFS.readFile(path, "base64");
      let mime = "image/jpeg";
      const extMatch = path.match(/\.(\w+)$/);
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        if (ext === "png") mime = "image/png";
        else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
        else if (ext === "webp") mime = "image/webp";
      }
      return `data:${mime};base64,${base64}`;
    } catch (e) { console.warn("RNFS readFile failed", e); return normalized; }
  }
  return normalized;
};

const LOGO_ASSETS = {
  progardenlogo: require('../../assets/progardenlogo.png'),
  hardendramalogo: require('../../assets/hardendramalogo.png'),
  Vgilogo: require('../../assets/Vgilogo.png'),
};

export const generateHTML = async (data, type = 'INVOICE') => {
  const {
    supplierDetails = {},
    buyerDetails = {},
    shipToDetails = {},
    productDetails = [],
    bankDetails = {},
    termsAndConditions = "",
    signature = "",
    otherCharges = [],
    overallGstEnabled = false,
    overallGstRate = "18",
    advanceReceived = "",
    receivedAmount = 0
  } = data || {};
  const docDate = type === 'INVOICE' ? data.invoiceDate : data.quotationDate;
  const docPrefix = type === 'INVOICE' ? data.invoicePrefix : data.quotationPrefix;
  const docNumber = type === 'INVOICE' ? data.invoiceNumber : data.quotationNumber;
  const docExpiry = type === 'INVOICE' ? data.dueDate : data.quotationValidity;
  const docTitle = type === 'INVOICE' ? 'TAX INVOICE' : 'QUOTATION';
  const docNumberLabel = type === 'INVOICE' ? 'Invoice Number' : 'Quotation Number';
  const docDateLabel = type === 'INVOICE' ? 'Invoice Date' : 'Quotation Date';
  const docExpiryLabel = type === 'INVOICE' ? 'Due Date' : 'Valid Until';

  const signatureSrc = await uriToDataUri(signature);

  let companyLogoUri;
  if (supplierDetails?.logoKey && LOGO_ASSETS[supplierDetails.logoKey]) {
    companyLogoUri = Image.resolveAssetSource(LOGO_ASSETS[supplierDetails.logoKey]).uri;
  } else {
    companyLogoUri = supplierDetails?.logoUrl || supplierDetails?.image
      || Image.resolveAssetSource(require('../../assets/logo.png')).uri;
  }
  const supplierImageSrc = await uriToDataUri(companyLogoUri);

  const supplierState = (supplierDetails?.state || "").toLowerCase().trim();
  const buyerState = (buyerDetails?.state || "").toLowerCase().trim();
  const isInterState = supplierState !== buyerState && supplierState !== "" && buyerState !== "";

  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const showGSTColumns = (productDetails || []).some((p) => parseFloat(p?.gstRate || 0) > 0);

  const productRows = (productDetails || []).map((product, index) => {
    const { productName = "", description = "", quantity = 0, hsn = "", unitPrice = 0, unit = "PCS", discount = "", discountType = "percent", taxInclusive = false, gstRate = "0" } = product || {};
    const qty = parseFloat(quantity) || 0;
    const rate = parseFloat(unitPrice) || 0;
    const gstPercent = parseFloat(gstRate) || 0;
    let baseAmt = qty * rate;
    let discAmt = 0;
    if (discount !== "" && discount !== null) {
      discAmt = discountType === "percent" ? baseAmt * (parseFloat(discount) / 100) : parseFloat(discount);
    }
    let actualTaxable = baseAmt - discAmt;
    if (taxInclusive) actualTaxable = actualTaxable / (1 + gstPercent / 100);
    const taxVal = actualTaxable * (gstPercent / 100);
    const lineTotal = actualTaxable + taxVal;
    subtotal += baseAmt;
    totalDiscount += discAmt;
    totalTax += taxVal;
    const halfRate = gstPercent / 2;
    const halfTax = taxVal / 2;
    let taxColumnsHTML = "";
    if (showGSTColumns) {
      if (isInterState) {
        taxColumnsHTML = `<td style="border-right:1.5px solid #000;">${gstPercent.toFixed(2)}%</td><td style="border-right:1.5px solid #000;">${taxVal.toFixed(2)}</td>`;
      } else {
        taxColumnsHTML = `<td style="border-right:1.5px solid #000;">${halfRate.toFixed(2)}%</td><td style="border-right:1.5px solid #000;">${halfTax.toFixed(2)}</td><td style="border-right:1.5px solid #000;">${halfRate.toFixed(2)}%</td><td style="border-right:1.5px solid #000;">${halfTax.toFixed(2)}</td>`;
      }
    }
    const prodImgUri = product.image || product.productImage || null;
    const prodImgHTML = prodImgUri ? '<img src="' + prodImgUri + '" class="prod-img" />' : '';
    return `
      <tr style="vertical-align:top;border-bottom:1.5px solid #000;">
        <td style="border-right:1.5px solid #000;padding:6px 4px;">${index + 1}</td>
        <td style="border-right:1.5px solid #000;text-align:left;padding:6px 6px;">
          <div style="font-weight:bold;font-size:12px;line-height:1.3;">${productName}</div>
          <div style="font-size:8px;margin-top:2px;line-height:1.3;color:#333;">${description}</div>
          ${prodImgHTML}
        </td>
        <td style="border-right:1.5px solid #000;padding:6px 4px;">${hsn || "-"}</td>
        <td style="border-right:1.5px solid #000;padding:6px 4px;">${qty}</td>
        <td style="border-right:1.5px solid #000;padding:6px 4px;">${unit || "PCS"}</td>
        <td style="border-right:1.5px solid #000;padding:6px 4px;">${rate.toFixed(2)}</td>
        <td style="border-right:1.5px solid #000;padding:6px 4px;background:#dae8f5;">${actualTaxable.toFixed(2)}</td>
        ${showGSTColumns ? taxColumnsHTML : ""}
        <td style="font-weight:bold;white-space:nowrap;padding:6px 4px;">₹ ${lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join("");

  const emptyRowCount = Math.max(0, 8 - (productDetails || []).length);
  const baseCols = 8; // Sr, Name, HSN, Qty, Unit, Rate, Taxable, Total
  const gstExtraCols = showGSTColumns ? (isInterState ? 2 : 4) : 0;
  const totalCols = baseCols + gstExtraCols;
  const emptyRowHTML = emptyRowCount > 0 ? `
    <tr style="height:${emptyRowCount * 35}px;">
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>
      <td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;background:#dae8f5;"></td>
      ${showGSTColumns ? (isInterState
      ? '<td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td><td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>'
      : '<td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td><td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td><td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td><td style="border-right:1.5px solid #000;border-top:none;border-bottom:none;"></td>')
      : ''}
      <td style="border-top:none;border-bottom:none;"></td>
    </tr>
  ` : "";

  const taxableBase = subtotal - totalDiscount;
  const rawProductTotal = taxableBase + totalTax;
  // Other charges
  const hasOtherCharges = Array.isArray(otherCharges) && otherCharges.length > 0;
  let otherChargesTotal = 0;
  if (hasOtherCharges) {
    otherChargesTotal = otherCharges.reduce((sum, c) => sum + (parseFloat(c.amount || c.value || 0)), 0);
  }
  // Overall GST on (products + other charges)
  const overallGstParsed = parseFloat(overallGstRate) || 18;
  const baseForOverallGst = rawProductTotal + otherChargesTotal;
  const overallGstAmount = overallGstEnabled ? baseForOverallGst * (overallGstParsed / 100) : 0;
  const rawGrandTotal = rawProductTotal + otherChargesTotal + overallGstAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;
  const sgstAmount = showGSTColumns && !isInterState ? totalTax / 2 : 0;
  const cgstAmount = showGSTColumns && !isInterState ? totalTax / 2 : 0;
  const igstAmount = showGSTColumns && isInterState ? totalTax : 0;
  const safe = (v) => v || "-";
  const totalQty = (productDetails || []).reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
  const totalLabel = (hasOtherCharges || overallGstEnabled) ? 'Subtotal' : 'Total';

  const totalRowHTML = `
  <tr class="total-row blue-bg" style="border-top:1.5px solid #000;">
    <td colspan="3" style="text-align:right;font-weight:bold;padding-right:16px;border-right:1.5px solid #000;">${totalLabel}</td>
    <td style="font-weight:bold;border-right:1.5px solid #000;">${totalQty}</td>
    <td style="border-right:1.5px solid #000;"></td>
    <td style="border-right:1.5px solid #000;"></td>
    <td style="font-weight:bold;white-space:nowrap;border-right:1.5px solid #000;">₹ ${taxableBase.toFixed(2)}</td>
    ${showGSTColumns ? (isInterState
      ? `<td style="border-right:1.5px solid #000;"></td><td style="font-weight:bold;white-space:nowrap;border-right:1.5px solid #000;">₹ ${igstAmount.toFixed(2)}</td>`
      : `<td style="border-right:1.5px solid #000;"></td><td style="font-weight:bold;white-space:nowrap;border-right:1.5px solid #000;">₹ ${cgstAmount.toFixed(2)}</td><td style="border-right:1.5px solid #000;"></td><td style="font-weight:bold;white-space:nowrap;border-right:1.5px solid #000;">₹ ${sgstAmount.toFixed(2)}</td>`) : ""}
    <td style="font-weight:bold;white-space:nowrap;">₹ ${rawProductTotal.toFixed(2)}</td>
  </tr>`;

  const numberToWords = (num) => {
    if (!num || num === 0) return "Zero Rupees Only";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const cvt = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + cvt(n % 100) : "");
    };
    let intPart = Math.floor(num);
    let result = "";
    if (intPart >= 10000000) { result += cvt(Math.floor(intPart / 10000000)) + " Crore "; intPart %= 10000000; }
    if (intPart >= 100000) { result += cvt(Math.floor(intPart / 100000)) + " Lakh "; intPart %= 100000; }
    if (intPart >= 1000) { result += cvt(Math.floor(intPart / 1000)) + " Thousand "; intPart %= 1000; }
    if (intPart > 0) result += cvt(intPart);
    return result.trim() + " Rupees Only";
  };
  const grandTotalInWords = numberToWords(grandTotal);

  let parsedTerms = "";
  let termsTitle = "Terms And Conditions";

  if (Array.isArray(termsAndConditions)) {
    const allLines = [];
    termsAndConditions.forEach(function (t) {
      if (typeof t === 'string') {
        allLines.push(...t.split('\n'));
      } else if (t && typeof t === 'object') {
        const str = t.content || t.text || t.term || '';
        if (str) allLines.push(...String(str).split('\n'));
      }
    });
    parsedTerms = allLines.map(function (line) {
      return '<div style="margin-bottom:2px;">' + line + '</div>';
    }).join('');
  } else if (typeof termsAndConditions === 'object' && termsAndConditions !== null) {
    if (termsAndConditions.title) {
      termsTitle = termsAndConditions.title;
    }
    const raw = termsAndConditions.content || termsAndConditions.text || termsAndConditions.term || JSON.stringify(termsAndConditions);
    parsedTerms = String(raw).split('\n').map(function (t) {
      const trimmed = t.trim();
      if (!trimmed) return '';
      return '<div style="margin-bottom:2px;">' + trimmed + '</div>';
    }).join('');
  } else if (termsAndConditions) {
    parsedTerms = String(termsAndConditions).split('\n').map(function (t) {
      const trimmed = t.trim();
      if (!trimmed) return '';
      return '<div style="margin-bottom:2px;">' + trimmed + '</div>';
    }).join('');
  } else {
    parsedTerms = "";
  }

  const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: sans-serif; font-size: 11px; color: #000; margin-top: 5px; }
  .wrap { border: 1.5px solid #000; }
  .bb { border-bottom: 1.5px solid #000; }
  .br { border-right: 1.5px solid #000; }
  .bl { border-left: 1.5px solid #000; }
  .bt { border-top: 1.5px solid #000; }
  .blue-bg { background: #dae8f5; }
  .flex { display: flex; }
  .flex1 { flex: 1; }
  .bold { font-weight: bold; }
  .center { text-align: center; }
  .right { text-align: right; }
  .left { text-align: left; }
  .vtop { vertical-align: top; }
  table { width: 100%; border-collapse: collapse; }
  .state-badge { border: 1px solid #000; padding: 1px 6px; border-radius: 3px; font-weight: 500; display: inline-block; }

  /* Header */
  .header { display: flex; padding: 12px 16px; align-items: center; }
  .logo-box { width: 16.6%; display: flex; align-items: center; justify-content: center; }
  .logo-img { height: 75px; width: auto; max-width: 120px; object-fit: contain; }
  .prod-img { max-width: 60px; max-height: 45px; object-fit: contain; margin-top: 4px; }
  .company-box { width: 66.6%; text-align: center; }
  .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  .company-addr { font-size: 12px; margin-top: 2px; font-weight: 500; max-width: 420px; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.4; margin-left: auto; margin-right: auto; }
  .gstin-row { font-size: 13px; margin-top: 4px; display: flex; justify-content: center; gap: 12px; }

  /* Title */
  .title-bar { display: flex; justify-content: space-between; align-items: center; padding: 5px 16px; }
  .doc-title { font-size: 17px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; flex: 1; text-align: center; }
  .copy-mark { flex: 1; text-align: right; font-style: italic; font-size: 11px; color: #555; }

  /* Meta */
  .meta-block { font-size: 12px; padding: 6px 12px; }
  .meta-row { display: flex; justify-content: space-between; padding: 1px 0; }

  /* Customer */
  .cust-grid { display: flex; }
  .cust-half { width: 50%; }
  .cust-header { text-align: center; font-weight: bold; padding: 3px 0; font-size: 12.5px; }
  .cust-body { padding: 8px 12px; min-height: 110px; position: relative; font-size: 12.5px; }
  .cust-body td { padding-bottom: 4px; vertical-align: top; }
  .cust-label { width: 60px; }
  .cust-colon { width: 15px; }
  .state-code-box { position: absolute; bottom: 0; right: 0; border-top: 1.5px solid #000; border-left: 1.5px solid #000; padding: 4px 8px; font-size: 11px; display: flex; gap: 16px; background: #fff; }

  /* Product Table */
  .prod-table th { border: 1.5px solid #000; padding: 4px; font-size: 11px; text-align: center; font-weight: bold; }
  .prod-table td { border-right: 1.5px solid #000; padding: 6px 4px; font-size: 11px; text-align: center; vertical-align: top; }
  .prod-table td:last-child { border-right: none; }
  .prod-name { font-weight: bold; font-size: 12px; line-height: 1.3; text-align: left; }
  .prod-desc { font-size: 8px; margin-top: 2px; line-height: 1.3; color: #333; text-align: left; }
  .taxable-col { background: #dae8f5; }
  .total-row td { border-top: 1.5px solid #000; font-weight: bold; font-size: 11px; white-space: nowrap; }
  .filler-row td { border-top: none; border-bottom: none; }

  /* Footer */
  .footer { display: flex; }
  .footer-left { width: 66%; }
  .footer-right { width: 34%; }
  .words-box { padding: 8px; min-height: 45px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-weight: bold; font-size: 11.5px; }
  .words-value { font-size: 13px; margin-top: 4px; }
  .bank-box { padding: 8px; }
  .bank-title { color: #1565C0; font-weight: bold; font-size: 13px; margin-bottom: 4px; padding-left: 4px; }
  .bank-table td { padding: 1.5px 4px; font-size: 12px; }
  .bank-val { font-weight: bold; text-align: right; padding-right: 8px; }
  .terms-box { padding: 8px 12px; }
  .terms-title { font-weight: bold; font-size: 11.5px; margin-bottom: 4px; }
  .terms-text { font-size: 10px; line-height: 1.6; }

  /* Totals */
  .totals-table { font-size: 11px; font-weight: 600; border-collapse: collapse; width: 100%; table-layout: fixed; }
  .totals-table td { padding: 4px 6px; word-wrap: break-word; }
  .totals-label { width: 58%; overflow: hidden; }
  .totals-val { text-align: right; font-weight: bold; white-space: nowrap; width: 42%; }

  /* Signature */
  .sig-box { flex: 1; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; text-align: center; min-height: 135px; }
  .sig-cert { font-size: 8px; line-height: 1.3; }
  .sig-company { font-weight: bold; font-size: 10px; margin-top: 4px; }
  .sig-img { max-height: 40px; max-width: 120px; object-fit: contain; margin: 8px auto; }
  .sig-auth { font-size: 12px; padding-bottom: 8px; }
</style>
</head>
<body>
<div class="wrap">
  <!-- Header -->
  <div class="header bb">
    <div class="logo-box">
      ${supplierImageSrc ? '<img src="' + supplierImageSrc + '" class="logo-img" />' : ''}
    </div>
    <div class="company-box">
      <div class="company-name">${supplierDetails?.firmName || ''}</div>
      ${(() => {
      const line1 = supplierDetails?.street || supplierDetails?.address;

      const line2 = [
        supplierDetails?.city,
        supplierDetails?.state,
        supplierDetails?.pincode
      ].filter(Boolean).join(', ');

      const addr1 = [line1, line2].filter(Boolean).join('<br>');

      return '<div class="company-addr">' + addr1 + '</div>';
    })()}
      <div class="gstin-row">
        ${supplierDetails?.gstin ? '<span>GSTIN : ' + supplierDetails.gstin + '</span>' : ''}
        ${supplierDetails?.state ? '<span class="state-badge">State Code : ' + (supplierDetails?.stateCode || supplierDetails?.state) + '</span>' : ''}
      </div>
    </div>
    <div style="width:16.6%"></div>
  </div>

  <!-- Tax Invoice Bar -->
  <div class="title-bar blue-bg bb">
    <div class="flex1"></div>
    <div class="doc-title">${docTitle}</div>
    <div class="copy-mark">Original For Recipient</div>
  </div>

  <!-- Invoice Meta -->
  <div class="meta-block">
    <div class="meta-row"><span>${docNumberLabel}</span><span class="bold">${docPrefix || ""}${docNumber || ""}</span></div>
    <div class="meta-row"><span>${docDateLabel}</span><span class="bold">${docDate || ""}</span></div>
    <div class="meta-row"><span>State</span><span class="bold">${supplierDetails?.state || '-'}</span></div>
    <div class="meta-row"><span>Reverse Charge</span><span class="bold">NO</span></div>
  </div>

  <!-- Customer Section -->
  <div class="cust-grid bt bb">
    <div class="cust-half br">
      <div class="cust-header blue-bg bb">Details of Receiver | Billed to:</div>
      <div class="cust-body">
        <table style="width:85%;text-align:left;border-collapse:collapse;">
          <tr><td class="cust-label vtop">Name</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.companyName || '-'}</td></tr>
          <tr><td class="cust-label vtop">Address</td><td class="cust-colon vtop">:</td><td style="line-height:1.3">${[buyerDetails?.address, buyerDetails?.city, buyerDetails?.state, buyerDetails?.pincode].filter(Boolean).join(', ')}</td></tr>
          <tr><td class="cust-label vtop">Email</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.email || '-'}</td></tr>
          <tr><td class="cust-label vtop">Mobile</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.mobile || '-'}</td></tr>
          <tr><td class="cust-label vtop">GSTIN</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.gstin || 'URP'}</td></tr>
          <tr><td class="cust-label vtop">State</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.state || '-'}</td></tr>
          <tr><td class="cust-label vtop">Country</td><td class="cust-colon vtop">:</td><td>INDIA</td></tr>
        </table>
        ${buyerDetails?.state ? '<div class="state-code-box"><span>State<br/>Code</span><span style="font-weight:500;font-size:12.5px;align-self:center">: ' + (buyerDetails?.stateCode || buyerDetails?.state) + '</span></div>' : ''}
      </div>
    </div>
    <div class="cust-half">
      <div class="cust-header blue-bg bb">Details of Consignee | Shipped to:</div>
      <div class="cust-body">
        <table style="width:85%;text-align:left;border-collapse:collapse;">
          <tr><td class="cust-label vtop">Name</td><td class="cust-colon vtop">:</td><td>${shipToDetails?.companyName || buyerDetails?.companyName || '-'}</td></tr>
          <tr><td class="cust-label vtop">Address</td><td class="cust-colon vtop">:</td><td style="line-height:1.3">${[shipToDetails?.address || buyerDetails?.address, shipToDetails?.city || buyerDetails?.city, shipToDetails?.state || buyerDetails?.state, shipToDetails?.pincode || buyerDetails?.pincode].filter(Boolean).join(', ')}</td></tr>
          <tr><td class="cust-label vtop">Email</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.email || '-'}</td></tr>
          <tr><td class="cust-label vtop">Mobile</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.mobile || '-'}</td></tr>
          <tr><td class="cust-label vtop">GSTIN</td><td class="cust-colon vtop">:</td><td>${buyerDetails?.gstin || "URP"}</td></tr>
          <tr><td class="cust-label vtop">State</td><td class="cust-colon vtop">:</td><td>${shipToDetails?.state || buyerDetails?.state || '-'}</td></tr>
          <tr><td class="cust-label vtop">Country</td><td class="cust-colon vtop">:</td><td>INDIA</td></tr>
        </table>
        ${(shipToDetails?.state || buyerDetails?.state) ? '<div class="state-code-box"><span>State<br/>Code</span><span style="font-weight:500;font-size:12.5px;align-self:center">: ' + (shipToDetails?.stateCode || shipToDetails?.state || buyerDetails?.state) + '</span></div>' : ''}
      </div>
    </div>
  </div>

  <!-- Product Table -->
  <table class="prod-table" style="border-bottom:1.5px solid #000;">
    <thead>
      <tr class="blue-bg">
        <th rowspan="2" style="width:40px">Sr.<br/>No.</th>
        <th rowspan="2">Name of Product</th>
        <th rowspan="2" style="width:55px">HSN/SAC</th>
        <th rowspan="2" style="width:35px">QTY</th>
        <th rowspan="2" style="width:35px">Unit</th>
        <th rowspan="2" style="width:45px">Rate</th>
        <th rowspan="2" style="width:75px">Taxable<br/>Value</th>
        ${showGSTColumns ? (isInterState
      ? '<th colspan="2" style="border-bottom:1.5px solid #000">IGST</th>'
      : '<th colspan="2" style="border-bottom:1.5px solid #000">CGST</th><th colspan="2" style="border-bottom:1.5px solid #000">SGST</th>')
      : ''}
        <th rowspan="2" style="width:80px">Total</th>
      </tr>
      ${showGSTColumns ? '<tr class="blue-bg">' + (isInterState
      ? '<th style="width:45px">Rate</th><th style="width:55px">Amount</th>'
      : '<th style="width:45px">Rate</th><th style="width:55px">Amount</th><th style="width:45px">Rate</th><th style="width:55px">Amount</th>')
      + '</tr>' : ''}
    </thead>
    <tbody>
      ${productRows}
      ${emptyRowHTML}
      ${totalRowHTML}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <!-- Left -->
    <div class="footer-left br" style="display:flex;flex-direction:column;">
      <div class="words-box bb">
        <span>Total Invoice Amount in words</span>
        <span class="words-value">${grandTotalInWords} /-</span>
      </div>
      <div class="bank-box">
        ${bankDetails?.accountNumber ? '<div class="bank-title">🏦 Bank and Payment Details</div><table class="bank-table"><tr><td style="width:100px;padding-left:4px">Account Name</td><td class="bank-val">' + safe(bankDetails.accountName) + '</td></tr><tr><td style="padding-left:4px">Account No.</td><td class="bank-val">' + safe(bankDetails.accountNumber) + '</td></tr><tr><td style="padding-left:4px">IFSC Code</td><td class="bank-val">' + safe(bankDetails.ifsc) + '</td></tr><tr><td style="padding-left:4px">Bank Name</td><td class="bank-val">' + safe(bankDetails.bankName) + '</td></tr><tr><td style="padding-left:4px">Branch Name</td><td class="bank-val" style="text-transform:uppercase">' + safe(bankDetails.branch) + '</td></tr></table>' : ''}
      </div>
      <div class="terms-box bt" style="flex:1;">
        <div class="terms-title">${termsTitle}</div>
        <div class="terms-text">${parsedTerms}</div>
      </div>
    </div>

    <!-- Right -->
    <div class="footer-right" style="display:flex;flex-direction:column;">
      <table class="totals-table" style="border-bottom:1.5px solid #000;">
        <tr class="blue-bg" style="border-bottom:1.5px solid #000"><td class="totals-label br">${(hasOtherCharges || overallGstEnabled) ? 'Subtotal' : 'Total Amount Before Tax'}</td><td class="totals-val">₹ ${rawProductTotal.toFixed(2)}</td></tr>
        ${hasOtherCharges ? otherCharges.map(function (c) { return '<tr style="background:#fff;border-bottom:1px solid #ddd"><td class="totals-label br" style="text-align:right;padding-left:8px">' + (c.name || c.label || 'Other Charge') + '</td><td class="totals-val">₹ ' + (parseFloat(c.amount || c.value || 0)).toFixed(2) + '</td></tr>'; }).join('') : ''}
        ${showGSTColumns ? (isInterState
      ? '<tr style="background:#fff"><td class="totals-label br" style="text-align:right">Add : IGST</td><td class="totals-val">₹ ' + igstAmount.toFixed(2) + '</td></tr>'
      : '<tr style="background:#fff"><td class="totals-label br" style="text-align:right">Add : CGST</td><td class="totals-val">₹ ' + cgstAmount.toFixed(2) + '</td></tr><tr style="background:#fff;border-bottom:1.5px solid #000"><td class="totals-label br" style="text-align:right">Add : SGST</td><td class="totals-val">₹ ' + sgstAmount.toFixed(2) + '</td></tr>')
      : ''}
        ${showGSTColumns ? '<tr class="blue-bg" style="border-bottom:1.5px solid #000"><td class="totals-label br">Total Tax Amount</td><td class="totals-val">₹ ' + totalTax.toFixed(2) + '</td></tr>' : ''}
        ${overallGstEnabled ? '<tr style="background:#fff;border-bottom:1.5px solid #000"><td class="totals-label br" style="text-align:right">Overall GST (' + overallGstParsed + '%)</td><td class="totals-val">₹ ' + overallGstAmount.toFixed(2) + '</td></tr>' : ''}
        ${roundOff !== 0 ? '<tr class="blue-bg" style="border-bottom:1.5px solid #000"><td class="totals-label br">Round Off Value</td><td class="totals-val">₹ ' + roundOff.toFixed(2) + '</td></tr>' : ''}
        <tr class="blue-bg" style="border-bottom:1.5px solid #000"><td class="totals-label br">Grand Total</td><td class="totals-val">₹ ${grandTotal.toFixed(2)}</td></tr>
        <tr style="background:#fff"><td class="totals-label br">Balance Due</td><td class="totals-val">₹ ${(grandTotal - (parseFloat(receivedAmount) || 0)).toFixed(2)}</td></tr>
      </table>

      <div class="sig-box">
        <div>
          <div class="sig-cert">Certified that the particular given above are true and correct</div>
          <div class="sig-company">For, ${supplierDetails?.firmName || ''}</div>
        </div>
        ${signatureSrc ? '<img src="' + signatureSrc + '" class="sig-img" />' : ''}
        <div class="sig-auth">Authorised Signatory</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

  return html;
};
export const generateDocumentPDF = async (docData, type = 'INVOICE') => {
  try {
    // Native module not available in Expo Go — requires custom native build
    if (!generatePDF) {
      Alert.alert(
        "PDF Not Available",
        "PDF generation requires a custom native build. Please run via 'npm run android'.",
        [{ text: "OK" }]
      );
      return null;
    }
    const ok = await requestStoragePermission();
    if (!ok) {
      Alert.alert("Permission Denied", "Storage permission is required to save the PDF.");
      return null;
    }
    const htmlContent = type === 'QUOTATION'
      ? await generateQuotationHTML(docData)
      : await generateHTML(docData, type);
    const buyerName = (docData.buyerDetails?.companyName || docData.buyerDetails?.name || 'Client').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
    const docPrefix = type === 'INVOICE' ? docData.invoicePrefix : docData.quotationPrefix;
    const docNumber = type === 'INVOICE' ? docData.invoiceNumber : docData.quotationNumber;
    const docId = `${docPrefix || ''}${docNumber || ''}`;
    const rawName = `${docId}-${buyerName}`.replace(/[^a-zA-Z0-9\-_]/g, '');
    const fileName = rawName.substring(0, 80) || 'document';
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === "ios" ? "Documents" : "Download",
    };
    const file = await generatePDF(options);
    return file;
  } catch (error) {
    console.error("Error generating PDF:", error);
    Alert.alert("Error", "Failed to generate PDF: " + (error?.message || error));
    return null;
  }
};


