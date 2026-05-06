import { Image } from "react-native";

let RNFS = null;
try {
  const mod = require('react-native-fs');
  RNFS = mod.default || mod;
  if (typeof RNFS?.DocumentDirectoryPath !== 'string') RNFS = null;
} catch (_) { RNFS = null; }

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
    } catch (e) { return uri; }
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
        else if (ext === "webp") mime = "image/webp";
      }
      return `data:${mime};base64,${base64}`;
    } catch (e) { return normalized; }
  }
  return normalized;
};

const LOGO_ASSETS = {
  progardenlogo: require('../../assets/progardenlogo.png'),
  hardendramalogo: require('../../assets/hardendramalogo.png'),
  Vgilogo: require('../../assets/Vgilogo.png'),
};

const safe = (v) => (v === null || v === undefined ? '' : String(v));

const numberToWords = (num) => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];
  const convert = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
  };
  let n = Math.floor(num);
  if (n === 0) return 'Zero Rupees Only';
  let result = '';
  let parts = [];
  parts.push(n % 1000); n = Math.floor(n / 1000);
  while (n > 0) { parts.push(n % 100); n = Math.floor(n / 100); }
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== 0) result += convert(parts[i]) + scales[i] + ' ';
  }
  return result.trim() + ' Rupees Only';
};

export const generateQuotationHTML = async (data) => {
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
    overallGstRate = '18',
  } = data || {};
  const docDate = data.quotationDate || '';
  const docPrefix = data.quotationPrefix || 'QUO';
  const docNumber = data.quotationNumber || '';
  const docValidity = data.quotationValidity || '';

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
  const showGSTColumns = (productDetails || []).some((p) => parseFloat(p?.gstRate || 0) > 0);

  // Convert product images to data URIs
  const productImagePromises = (productDetails || []).map(p => p?.productImage ? uriToDataUri(p.productImage) : Promise.resolve(null));
  const productImageDataUris = await Promise.all(productImagePromises);

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
    subtotal += actualTaxable;
    totalTax += taxVal;
    const halfRate = gstPercent / 2;
    const halfTax = taxVal / 2;

    // Product image HTML (fits inside name column)
    const imgDataUri = productImageDataUris[index];
    const productImgHTML = imgDataUri ? '<img src="' + imgDataUri + '" style="width:100%;max-height:160px;object-fit:contain;margin-top:6px;margin-bottom:4px;border-radius:4px;" />' : '';

    let taxCols = "";
    if (showGSTColumns) {
      if (isInterState) {
        taxCols = '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + gstPercent.toFixed(2) + '%</td><td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + taxVal.toFixed(2) + '</td>';
      } else {
        taxCols = '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + halfRate.toFixed(2) + '%</td><td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + halfTax.toFixed(2) + '</td><td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + halfRate.toFixed(2) + '%</td><td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + halfTax.toFixed(2) + '</td>';
      }
    }

    const taxableCell = showGSTColumns ? '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;background-color:#fdf8e7;">' + actualTaxable.toFixed(2) + '</td>' : '';

    return '<tr style="border-bottom:1px solid #a3a3a3;vertical-align:top;">'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + (index + 1) + '</td>'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;">'
      + (productName ? '<p style="font-weight:600;font-size:12px;">' + safe(productName) + '</p>' : '')
      + productImgHTML
      + (description ? '<p style="font-size:11px;margin-top:4px;color:#525252;line-height:1.4;">' + safe(description) + '</p>' : '')
      + '</td>'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + safe(hsn) + '</td>'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + qty + '</td>'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + safe(unit || 'PCS') + '</td>'
      + '<td style="border-right:1px solid #a3a3a3;padding:8px;text-align:center;">' + rate.toFixed(1) + '</td>'
      + taxableCell
      + taxCols
      + '<td style="padding:8px;text-align:center;">' + lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</td>'
      + '</tr>';
  }).join("");

  // Other charges total
  const otherChargesArr = Array.isArray(otherCharges) ? otherCharges : [];
  const otherChargesTotal = otherChargesArr.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // Overall GST calculation
  const useOverallGst = overallGstEnabled === true;
  const gstRateNum = parseFloat(overallGstRate) || 0;
  const totalBeforeGst = subtotal + otherChargesTotal;
  const overallGstAmount = useOverallGst ? totalBeforeGst * gstRateNum / 100 : 0;

  // Grand total: if overall GST enabled, use that; otherwise use per-product tax
  const grandTotal = useOverallGst
    ? totalBeforeGst + overallGstAmount
    : subtotal + totalTax + otherChargesTotal;
  const grandTotalInWords = numberToWords(Math.round(grandTotal));

  const formatAddress = (addr, city, state, pincode) => {
    const line1 = [addr].filter(Boolean).join(', ');
    const line2 = [city, state, pincode].filter(Boolean).join(', ');
    return [line1, line2].filter(Boolean).join('<br/>');
  };

  const supplierFullAddress = formatAddress(supplierDetails?.street || supplierDetails?.address, supplierDetails?.city, supplierDetails?.state, supplierDetails?.pincode);
  const buyerFullAddress = formatAddress(buyerDetails?.address, buyerDetails?.city, buyerDetails?.state, buyerDetails?.pincode);
  const shipFullAddress = formatAddress(
    shipToDetails?.address || buyerDetails?.address,
    shipToDetails?.city || buyerDetails?.city,
    shipToDetails?.state || buyerDetails?.state,
    shipToDetails?.pincode || buyerDetails?.pincode
  );

  // Parse terms
  let parsedTerms = '';
  if (Array.isArray(termsAndConditions) && termsAndConditions.length > 0) {
    // Each item can be {title, content}, {text}, {term}, or a plain string
    let allLines = [];
    termsAndConditions.forEach(function (t) {
      var raw = '';
      if (typeof t === 'string') { raw = t; }
      else if (t && typeof t === 'object') { raw = t.content || t.text || t.term || ''; }
      // Split content by newlines to get individual points
      String(raw).split('\n').forEach(function (line) {
        var trimmed = line.trim();
        if (trimmed) allLines.push(trimmed);
      });
    });
    parsedTerms = allLines.map(function (line) {
      // Don't auto-number lines that already have bullets or numbers
      var hasBullet = /^[\u2022\u25CF\u25CB\u2023\-\*]/.test(line);
      var hasNum = /^\d+[\.\)]/.test(line);
      if (hasBullet || hasNum) return '<div style="margin-bottom:2px;">' + line + '</div>';
      return '<div style="margin-bottom:2px;">' + line + '</div>';
    }).join('');
  } else if (typeof termsAndConditions === 'object' && termsAndConditions !== null && !Array.isArray(termsAndConditions)) {
    var raw = termsAndConditions.content || termsAndConditions.text || termsAndConditions.term || '';
    parsedTerms = String(raw).split('\n').map(function (t) {
      var trimmed = t.trim();
      if (!trimmed) return '';
      return '<div style="margin-bottom:2px;">' + trimmed + '</div>';
    }).join('');
  } else if (termsAndConditions) {
    parsedTerms = String(termsAndConditions).split('\n').map(function (t) {
      var trimmed = t.trim();
      if (!trimmed) return '';
      return '<div style="margin-bottom:2px;">' + trimmed + '</div>';
    }).join('');
  } else {
    parsedTerms = '';
  }

  // GST table header
  let theadHTML = '';
  if (showGSTColumns) {
    const gstLabel = isInterState ? 'IGST' : '';
    const gstSubCols = isInterState
      ? '<th colspan="2" style="border-right:1px solid #a3a3a3;padding:8px 4px;font-weight:normal;text-align:center;padding-top:8px;padding-bottom:4px;">IGST</th>'
      : '<th colspan="2" style="border-right:1px solid #a3a3a3;padding:8px 4px;font-weight:normal;text-align:center;padding-top:8px;padding-bottom:4px;">CGST</th><th colspan="2" style="border-right:1px solid #a3a3a3;padding:8px 4px;font-weight:normal;text-align:center;padding-top:8px;padding-bottom:4px;">SGST</th>';
    const gstSubRow = isInterState
      ? '<th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;width:55px;">Rate</th><th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;width:75px;">Amount</th>'
      : '<th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;">Rate</th><th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;">Amount</th><th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;">Rate</th><th style="border-right:1px solid #a3a3a3;border-top:1px solid #a3a3a3;padding:4px;font-weight:normal;">Amount</th>';

    theadHTML = '<thead><tr style="background-color:#f0f0f0;text-align:center;border-bottom:1px solid #a3a3a3;">'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:45px;">Sr.<br>No.</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;">Name of product</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:70px;">HSN/SAC</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:45px;">QTY</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:45px;">Unit</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:55px;">Rate</th>'
      + '<th rowspan="2" style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;white-space:nowrap;padding-left:4px;padding-right:4px;">Taxable Value</th>'
      + gstSubCols
      + '<th rowspan="2" style="padding:8px;font-weight:normal;width:80px;">Total</th>'
      + '</tr><tr style="background-color:#f0f0f0;text-align:center;border-bottom:1px solid #a3a3a3;">'
      + gstSubRow + '</tr></thead>';
  } else {
    // No GST — remove Taxable Value column entirely
    theadHTML = '<thead><tr style="background-color:#f0f0f0;text-align:center;border-bottom:1px solid #a3a3a3;">'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:40px;">Sr.<br>No.</th>'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;">Name of product</th>'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:65px;">HSN/SAC</th>'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:40px;">QTY</th>'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:40px;">Unit</th>'
      + '<th style="border-right:1px solid #a3a3a3;padding:8px;font-weight:normal;width:55px;">Rate</th>'
      + '<th style="padding:8px;font-weight:normal;width:80px;">Total</th>'
      + '</tr></thead>';
  }

  // Empty filler cells — dynamic based on columns
  const baseCols = 6; // Sr, Name, HSN, QTY, Unit, Rate
  let totalCols = baseCols + 1; // +Total
  if (showGSTColumns) { totalCols += 1; /* taxable */ totalCols += (isInterState ? 2 : 4); }
  let emptyCells = '';
  for (let i = 0; i < totalCols - 1; i++) {
    const isTaxableCell = showGSTColumns && i === 6;
    const bgStyle = isTaxableCell ? 'background-color:#fdf8e7;' : '';
    emptyCells += '<td style="border-right:1px solid #a3a3a3;' + bgStyle + '"></td>';
  }
  emptyCells += '<td></td>';

  // Bank details
  let bankDetailsHTML = '';
  if (bankDetails && bankDetails.accountNumber) {
    bankDetailsHTML = '<div style="width:100%;"><h3 style="font-size:14px;font-weight:600;margin-bottom:8px;color:black;text-align:center;">BANK DETAILS</h3>'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;border:1px solid #a3a3a3;color:black;"><tbody>'
      + '<tr style="border-bottom:1px solid #a3a3a3;"><td style="border-right:1px solid #a3a3a3;padding:6px 8px;background-color:#fcf5de;font-weight:500;width:45%;">A/c Holder</td><td style="padding:6px 8px;font-size:13.5px;">' + safe(bankDetails.accountName) + '</td></tr>'
      + '<tr style="border-bottom:1px solid #a3a3a3;"><td style="border-right:1px solid #a3a3a3;padding:6px 8px;background-color:#fcf5de;font-weight:500;">Account No</td><td style="padding:6px 8px;font-size:13.5px;">' + safe(bankDetails.accountNumber) + '</td></tr>'
      + '<tr style="border-bottom:1px solid #a3a3a3;"><td style="border-right:1px solid #a3a3a3;padding:6px 8px;background-color:#fcf5de;font-weight:500;">IFSC code</td><td style="padding:6px 8px;font-size:13.5px;">' + safe(bankDetails.ifsc) + '</td></tr>'
      + '<tr style="border-bottom:1px solid #a3a3a3;"><td style="border-right:1px solid #a3a3a3;padding:6px 8px;background-color:#fcf5de;font-weight:500;">Bank Name</td><td style="padding:6px 8px;font-size:13.5px;">' + safe(bankDetails.bankName) + '</td></tr>'
      + '<tr><td style="border-right:1px solid #a3a3a3;padding:6px 8px;background-color:#fcf5de;font-weight:500;line-height:1.3;">Branch Name</td><td style="padding:6px 8px;line-height:1.3;font-size:13.5px;">' + safe(bankDetails.branchName) + '</td></tr>'
      + '</tbody></table></div>';
  }

  // Logo HTML
  const logoHTML = supplierImageSrc
    ? '<img src="' + supplierImageSrc + '" style="height:52px;max-width:140px;object-fit:contain;" />'
    : '<div style="width:48px;height:48px;border:2px solid #0b4d2c;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;letter-spacing:0.05em;color:#0b4d2c;">LOGO</div>';

  // Signature HTML
  const sigImgHTML = signatureSrc ? '<img src="' + signatureSrc + '" style="max-height:60px;max-width:250px;object-fit:contain;margin:0 auto;" />' : '';

  // GSTIN / PAN / UDYAM lines — respect visibility toggles
  const supplierGSTIN = (supplierDetails?.showGstin !== false) && supplierDetails?.gstin ? '<span>GSTIN: ' + safe(supplierDetails.gstin) + '</span>' : '';
  const supplierPAN = (supplierDetails?.showPan === true) && supplierDetails?.pan ? '<span>PAN: ' + safe(supplierDetails.pan) + '</span>' : '';
  const supplierUDYAM = (supplierDetails?.showUdyam === true) && supplierDetails?.udyam ? '<span>UDYAM: ' + safe(supplierDetails.udyam) + '</span>' : '';
  const supplierEmailHTML = (supplierDetails?.showEmail !== false) && supplierDetails?.email ? '<span>' + safe(supplierDetails.email) + '</span>' : '';
  const supplierMobileHTML = (supplierDetails?.showMobile !== false) && supplierDetails?.mobile ? '<span>' + safe(supplierDetails.mobile) + '</span>' : '';
  // Corporate address
  const supplierCorpFullAddress = formatAddress(supplierDetails?.corpAddress, supplierDetails?.corpCity, supplierDetails?.corpState, supplierDetails?.corpPincode);
  const supplierCorpAddr = (supplierDetails?.showCorpAddress === true) && supplierCorpFullAddress ? '<span><b>Corp. Add.- </b>' + supplierCorpFullAddress + '</span>' : '';
  // Registered address — respect toggle
  const showRegAddr = supplierDetails?.showRegisteredAddress !== false;
  const supplierAddrHTML = showRegAddr ? (supplierDetails?.showCorpAddress ? '<span><b>Regd. Add.- </b>' : '') + supplierFullAddress + '</span>' : '';

  const buyerGSTIN = buyerDetails?.gstin ? '<div>GSTIN: ' + safe(buyerDetails.gstin) + '</div>' : '';
  const shipEmail = (shipToDetails?.email || buyerDetails?.email) ? '<div>Email: ' + safe(shipToDetails?.email || buyerDetails?.email) + '</div>' : '';

  // Signature visibility
  const showSigInPdf = data?.showSignatureInPdf !== false;

  // Build other charges rows for totals
  let otherChargesHTML = '';
  otherChargesArr.forEach(function (c) {
    otherChargesHTML += '<div style="border:1px solid #a3a3a3;border-top:none;background-color:#fff;padding:4px 12px;display:flex;align-items:center;font-size:12px;color:black;width:100%;height:26px;">'
      + '<span style="width:120px;">' + safe(c.description) + '</span>'
      + '<span style="margin-right:25px;flex:1;text-align:center;">:</span>'
      + '<span style="flex:2;text-align:right;">' + (parseFloat(c.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>'
      + '</div>';
  });

  // GST row — black text
  let gstRowHTML = '';
  if (useOverallGst) {
    gstRowHTML = '<div style="border:1px solid #a3a3a3;border-top:none;background-color:#fff;padding:4px 12px;display:flex;align-items:center;font-size:12px;color:black;width:100%;height:26px;">'
      + '<span style="width:120px;">GST @' + gstRateNum + '%</span>'
      + '<span style="margin-right:32px;flex:1;text-align:center;">:</span>'
      + '<span style="flex:2;text-align:right;">' + overallGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>'
      + '</div>';
  }

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Quotation</title>'
    + '<style>'
    + '@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5;color:#262626;}'
    + '.container{padding:20px 16px;display:flex;justify-content:center;}'
    + '.paper{width:820px;background:white;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);padding:24px 30px 16px 30px;margin-top:10px;}'
    + '@media print{body,.container{background:white;padding:0;display:block;}.paper{box-shadow:none;width:100%;padding:16px 20px 12px 20px;margin-top:10px;}}'
    + '</style></head><body><div class="container"><div class="paper">'

    // Header
    + '<div style="border-bottom:2px solid #0b4d2c;padding-bottom:4px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">'
    + '<div style="display:flex;align-items:center;gap:8px;color:#0b4d2c;">' + logoHTML + '</div>'
    + '<div style="font-size:28px;font-weight:bold;font-style:italic;letter-spacing:-0.03em;color:black;transform:scaleY(1.15);padding:0 8px;">Quotation</div>'
    + '</div>'

    // Company Info & Meta
    + '<div style="display:flex;justify-content:space-between;font-size:13px;color:black;margin-bottom:14px;line-height:1.35;">'
    + '<div style="display:flex;flex-direction:column;font-weight:600;">'
    + '<span style="font-size:18px;color:black;margin-bottom:4px;font-weight:bold;">' + safe(supplierDetails?.firmName) + '</span>'
    + supplierAddrHTML
    + supplierCorpAddr
    + supplierEmailHTML
    + supplierMobileHTML
    + supplierGSTIN
    + supplierPAN
    + supplierUDYAM
    + '</div>'
    + '<div style="display:flex;flex-direction:column;align-items:flex-end;padding-top:4px;">'
    + '<div><span style="font-weight:bold;font-style:italic;">Quotation No:</span> <span style="font-style:italic;">' + safe(docPrefix) + '-' + safe(docNumber) + '</span></div>'
    + '<div><span style="font-weight:bold;font-style:italic;">Date:</span> <span style="font-style:italic;">' + safe(docDate) + '</span></div>'
    + '<div><span style="font-weight:bold;font-style:italic;">Valid Till:</span> <span style="font-style:italic;">' + safe(docValidity) + '</span></div>'
    + '</div></div>'

    // Customer & Shipping — hide Ship To when disabled
    + '<div style="display:flex;font-size:13px;color:black;position:relative;margin-bottom:14px;line-height:1.35;">'
    + '<div style="' + (shipToDetails ? 'width:50%;padding-right:24px;' : 'width:100%;') + 'display:flex;flex-direction:column;">'
    + '<div style="font-weight:bold;font-style:italic;margin-bottom:4px;color:black;">Quotation For:</div>'
    + '<div>' + safe(buyerDetails?.companyName || buyerDetails?.name) + '</div>'
    + '<div>' + buyerFullAddress + '</div>'
    + '<div>' + safe(buyerDetails?.mobile) + '</div>'
    + '<div>' + safe(buyerDetails?.email) + '</div>'
    + buyerGSTIN + '</div>'
    + (shipToDetails ? (
      '<div style="width:1px;background-color:#d4d4d4;position:absolute;left:54%;top:4px;bottom:4px;"></div>'
      + '<div style="width:50%;padding-left:56px;display:flex;flex-direction:column;">'
      + '<div style="font-weight:bold;font-style:italic;margin-bottom:4px;color:black;">Ship To:</div>'
      + '<div>Name: ' + safe(shipToDetails?.name || buyerDetails?.name) + '</div>'
      + '<div>Address: ' + shipFullAddress + '</div>'
      + '<div>Phone Number: ' + safe(shipToDetails?.mobile || buyerDetails?.mobile) + '</div>'
      + shipEmail + '</div>'
    ) : '')
    + '</div>'

    // Table
    + '<div style="width:100%;margin-bottom:0px;">'
    + '<table style="width:100%;font-size:12px;border-collapse:collapse;border:1px solid #a3a3a3;color:black;">'
    + theadHTML
    + '<tbody>' + productRows
    + '<tr style="height:40px;">' + emptyCells + '</tr>'
    + '</tbody></table>'
    + '</div>'

    // BOTTOM SECTION: Two Columns
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:15px;padding-top:0;">'

    // --- LEFT COLUMN ---
    + '<div style="flex:1;display:flex;flex-direction:column;gap:15px;">'
    // Amount in Words
    + '<div style="background-color:#f9fafb;display:flex;align-items:center;justify-content:center;color:black;padding:4px 8px;border:1px solid #f0f0f0;font-size:12px;font-weight:700;width:100%;">'
    + '<span>Amount In Words: ' + grandTotalInWords + '</span></div>'
    // Terms and Conditions
    + (parsedTerms ? (
      '<div style="font-size:14px;color:black;line-height:1.4;">'
      + '<div style="font-size:16px;font-weight:bold;margin-bottom:4px;">Terms and Conditions:</div>'
      + '<div style="margin-bottom:4px;">' + parsedTerms + '</div>'
      + '</div>'
    ) : '')
    + '</div>'

    // --- RIGHT COLUMN ---
    + '<div style="display:flex;flex-direction:column;gap:15px;width:290px;flex-shrink:0;">'
    // Totals Box
    + '<div style="display:flex;flex-direction:column;width:100%;">'
    + '<div style="border:1px solid #a3a3a3;background-color:#fff;padding:4px 10px;display:flex;align-items:center;font-size:12px;color:black;width:100%;height:24px;">'
    + '<span style="width:120px;">Subtotal</span>'
    + '<span style="margin-right:20px;flex:1;text-align:center;">:</span>'
    + '<span style="flex:2;text-align:right;">' + subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>'
    + '</div>'
    + otherChargesHTML
    + gstRowHTML
    + '<div style="border:1px solid #a3a3a3;border-top:none;background-color:#fbf5e1;padding:4px 10px;display:flex;align-items:center;font-size:12px;color:black;width:100%;height:28px;">'
    + '<span style="width:120px;font-weight:700;">Grand Total</span>'
    + '<span style="margin-right:20px;flex:1;text-align:center;">:</span>'
    + '<span style="flex:2;text-align:right;font-weight:700;">' + grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>'
    + '</div>'
    + '</div>'

    // Signature
    + (showSigInPdf ? (
      '<div style="width:280px;height:100px;border:1px solid #a3a3a3;display:flex;flex-direction:column;justify-content:space-between;text-align:center;padding-top:6px;padding-bottom:4px;position:relative;">'
      + '<div style="font-size:12px;font-weight:bold;color:black;margin-top:2px;line-height:1.2;padding:0 8px;">For, ' + safe(supplierDetails?.firmName) + '</div>'
      + sigImgHTML
      + '<div style="font-size:12px;color:black;position:absolute;bottom:4px;width:100%;text-align:center;">Authorized Signature</div></div>'
    ) : '')
    // Bank
    + bankDetailsHTML
    + '</div>'

    + '</div></div></body></html>';
};
