import { Alert, Platform, PermissionsAndroid } from "react-native";
import { generatePDF } from "react-native-html-to-pdf";
import Colors from "../colors";
import * as RNFS from "react-native-fs";

// --- Helper Functions (Same as generateQuotationPDF) ---

const requestStoragePermission = async () => {
  if (Platform.OS === "android") {
    if (Platform.Version >= 33) {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "App needs access to storage to save PDF files",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Permission error", err);
      return false;
    }
  }
  return true;
};

const uriToDataUri = async (uri) => {
  if (!uri) return null;
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
    } catch (e) {
      console.warn("RNFS readFile failed, fallback to file URI", e);
      return normalized;
    }
  }
  return normalized;
};

const numberToWords = (num) => {
  if (!num || num === 0) return "Zero Rupees Only";
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  let intPart = Math.floor(num);
  let result = '';
  
  if (intPart >= 10000000) {
    const crore = Math.floor(intPart / 10000000);
    result += convertLessThanThousand(crore) + ' Crore ';
    intPart %= 10000000;
  }
  if (intPart >= 100000) {
    const lakh = Math.floor(intPart / 100000);
    result += convertLessThanThousand(lakh) + ' Lakh ';
    intPart %= 100000;
  }
  if (intPart >= 1000) {
    const thousand = Math.floor(intPart / 1000);
    result += convertLessThanThousand(thousand) + ' Thousand ';
    intPart %= 1000;
  }
  if (intPart > 0) {
    result += convertLessThanThousand(intPart);
  }
  
  return result.trim() + ' Rupees Only';
};

const safe = (v) => (v || "-");

// --- HTML Generation ---

const generateHTML = async (data) => {
  const {
    invoiceNumber = "",
    invoiceDate = "",
    dueDate = "",
    supplierDetails = {},
    buyerDetails = {},
    productDetails = [],
    bankDetails = {},
    termsAndConditions = "",
    signature = "",
    invoicePrefix = "",
    reverseCharge = "No",
    vehicleNumber = "",
    challanNumber = "",
    placeOfSupply = "",
    invoiceStateCode = ""
  } = data || {};

  const supplierImageSrc = await uriToDataUri(supplierDetails.image);
  const signatureSrc = await uriToDataUri(signature);

  let subtotal = 0;
  let totalTaxAmount = 0;
  let totalQty = 0;

  // Generate Product Rows
  const productRows = (productDetails || [])
    .map((item, index) => {
      const {
        productName = "",
        hsn = "",
        quantity = 0,
        unit = "PCS",
        unitPrice = 0, // Rate
        gstRate = 0,
        amount = 0, // Taxable Value (Qty * Rate usually)
        totalAmount = 0 // Final amount with tax
      } = item || {};

      const qty = parseFloat(quantity) || 0;
      const rate = parseFloat(unitPrice) || 0;
      
      // Calculate derived values if not provided
      const taxableValue = parseFloat(amount) || (qty * rate);
      const taxRate = parseFloat(gstRate) || 0;
      const taxAmt = taxableValue * (taxRate / 100);
      const finalTotal = parseFloat(totalAmount) || (taxableValue + taxAmt);

      subtotal += taxableValue;
      totalTaxAmount += taxAmt;
      totalQty += qty;

      return `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${productName}</td>
          <td style="text-align:center;">${hsn || "-"}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:center;">${unit}</td>
          <td style="text-align:right;">${rate.toFixed(2)}</td>
          <td style="text-align:right;">${taxableValue.toFixed(2)}</td>
          <td style="text-align:center;">${taxRate}%</td>
          <td style="text-align:right;">${taxAmt.toFixed(2)}</td>
          <td style="text-align:right;">${finalTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const grandTotal = subtotal + totalTaxAmount;
  const grandTotalInWords = numberToWords(grandTotal);

  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>
        @page { size: A4; margin: 6mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; line-height: 1.3; }
        
        .page-wrap { padding: 4mm; border: 1px solid #ddd; min-height: 98vh; position: relative; }
        
        /* Header Section */
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .supplier-info { width: 50%; }
        .logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 5px; }
        .company-name { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 4px; }
        .company-details { font-size: 10px; }
        
        .invoice-meta { width: 45%; display: flex; flex-direction: column; align-items: flex-end; }
        .tax-invoice-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; text-align: right; width: 100%; }
        
        /* Meta Tables (Invoice No, Date etc) */
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 9px; }
        .meta-table td { border: 1px solid #000; padding: 4px; }
        .meta-label { font-weight: bold; background: #f0f0f0; width: 40%; }
        .meta-value { font-weight: bold; }

        /* Receiver Section */
        .section-header { background: #2d5f2e; color: #fff; padding: 4px; font-weight: bold; font-size: 10px; margin-top: 10px; border: 1px solid #000; }
        .receiver-box { border: 1px solid #000; border-top: none; padding: 8px; display: flex; margin-bottom: 15px; }
        .receiver-details { flex: 1; }
        .receiver-row { display: flex; margin-bottom: 2px; }
        .r-label { width: 80px; font-weight: bold; }
        .r-val { flex: 1; }

        /* Main Product Table */
        .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .product-table th { background: #2d5f2e; color: #fff; padding: 6px; font-size: 9px; border: 1px solid #000; text-align: center; }
        .product-table td { padding: 6px; font-size: 9px; border: 1px solid #000; vertical-align: top; }

        /* Footer Section */
        .footer-container { display: flex; justify-content: space-between; margin-top: 10px; }
        .amount-words { width: 55%; font-weight: bold; font-size: 11px; margin-bottom: 10px; }
        
        .totals-section { width: 40%; }
        .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .totals-table td { padding: 5px; border: 1px solid #000; font-size: 10px; }
        .t-label { text-align: left; font-weight: bold; }
        .t-val { text-align: right; }

        .terms-box { margin-top: 20px; font-size: 9px; }
        .signature-section { text-align: right; margin-top: 30px; font-size: 10px; page-break-inside: avoid; }
        .sig-img { max-height: 50px; max-width: 120px; margin-bottom: 5px; }

        /* Print Specifics */
        @media print {
            .page-wrap { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="page-wrap">
        
        <div class="header">
          <div class="supplier-info">
            ${supplierImageSrc ? `<img src="${supplierImageSrc}" class="logo"/>` : ''}
            <div class="company-name">${safe(supplierDetails.firmName)}</div>
            <div class="company-details">
              ${safe(supplierDetails.address)}<br>
              ${supplierDetails.city ? supplierDetails.city + ', ' : ''}${safe(supplierDetails.state)} - ${safe(supplierDetails.pincode)}<br>
              Phone: ${safe(supplierDetails.mobile)}<br>
              Email: ${safe(supplierDetails.email)}<br>
              <strong>PAN No:</strong> ${safe(supplierDetails.pan || "-")}
            </div>
          </div>

          <div class="invoice-meta">
            <div class="tax-invoice-title">TAX INVOICE</div>
            <div style="display: flex; gap: 10px; width: 100%;">
                <div style="flex: 1;">
                     <table class="meta-table">
                        <tr><td class="meta-label">Reverse Charge</td><td>${reverseCharge}</td></tr>
                        <tr><td class="meta-label">Invoice No.</td><td class="meta-value">${safe(invoicePrefix)}${safe(invoiceNumber)}</td></tr>
                        <tr><td class="meta-label">Invoice Date</td><td class="meta-value">${safe(invoiceDate)}</td></tr>
                        <tr><td class="meta-label">State</td><td>${safe(supplierDetails.state)}</td></tr>
                        <tr><td class="meta-label">State Code</td><td>${safe(invoiceStateCode || "07")}</td></tr>
                     </table>
                </div>
                <div style="flex: 1;">
                    <table class="meta-table">
                        <tr><td class="meta-label">Challan No.</td><td>${safe(challanNumber)}</td></tr>
                        <tr><td class="meta-label">Vehicle No.</td><td>${safe(vehicleNumber)}</td></tr>
                        <tr><td class="meta-label">Place of Supply</td><td>${safe(placeOfSupply)}</td></tr>
                    </table>
                </div>
            </div>
          </div>
        </div>

        <div class="section-header">Details of Receiver | Billed to:</div>
        <div class="receiver-box">
            <div class="receiver-details">
                <div class="receiver-row"><div class="r-label">Name</div><div class="r-val">: <strong>${safe(buyerDetails.companyName)}</strong></div></div>
                <div class="receiver-row"><div class="r-label">Address</div><div class="r-val">: ${safe(buyerDetails.address)}, ${safe(buyerDetails.city)}, ${safe(buyerDetails.state)} - ${safe(buyerDetails.pincode)}</div></div>
                <div class="receiver-row"><div class="r-label">GSTIN</div><div class="r-val">: <strong>${safe(buyerDetails.gstin)}</strong></div></div>
                <div class="receiver-row"><div class="r-label">State</div><div class="r-val">: ${safe(buyerDetails.state)}</div></div>
            </div>
        </div>

        <table class="product-table">
            <thead>
                <tr>
                    <th style="width: 5%;">Sr. No.</th>
                    <th style="width: 30%;">Name of product</th>
                    <th style="width: 10%;">HSN/SAC</th>
                    <th style="width: 5%;">QTY</th>
                    <th style="width: 5%;">Unit</th>
                    <th style="width: 10%;">Rate</th>
                    <th style="width: 10%;">Taxable Value</th>
                    <th style="width: 5%;">Rate (%)</th>
                    <th style="width: 10%;">Tax Amount</th>
                    <th style="width: 10%;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${productRows}
                <tr style="font-weight: bold; background-color: #f9f9f9;">
                    <td colspan="3" style="text-align: right;">Total Quantity</td>
                    <td style="text-align: center;">${totalQty}</td>
                    <td></td>
                    <td></td>
                    <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
                    <td></td>
                    <td style="text-align: right;">₹${totalTaxAmount.toFixed(2)}</td>
                    <td style="text-align: right;">₹${grandTotal.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer-container">
            <div style="width: 55%;">
                 <div class="amount-words">Total Invoice Amount in words:<br><span style="font-weight: normal; font-style: italic;">${grandTotalInWords}</span></div>
                 
                 ${bankDetails.accountNumber ? `
                 <div style="border: 1px solid #000; padding: 10px; margin-top: 10px; font-size: 9px;">
                    <strong>Bank Details:</strong><br>
                    Bank: ${safe(bankDetails.bankName)}<br>
                    A/C No: ${safe(bankDetails.accountNumber)}<br>
                    IFSC: ${safe(bankDetails.ifscCode)}<br>
                    Branch: ${safe(bankDetails.branchName)}
                 </div>
                 ` : ''}

                 <div class="terms-box">
                    <strong>Terms And Conditions</strong><br>
                    <ol style="padding-left: 15px; margin-top: 5px;">
                        <li>This is an electronically generated document.</li>
                        <li>All disputes are subject to ${safe(supplierDetails.city || "Delhi")} jurisdiction.</li>
                        ${termsAndConditions ? `<li>${termsAndConditions}</li>` : ''}
                    </ol>
                 </div>
            </div>

            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="t-label">Total Amount Before Tax</td>
                        <td class="t-val">${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td class="t-label">Add: Tax Amount</td>
                        <td class="t-val">${totalTaxAmount.toFixed(2)}</td>
                    </tr>
                    <tr style="background: #e0e0e0;">
                        <td class="t-label">Total Amount With Tax</td>
                        <td class="t-val"><strong>₹${grandTotal.toFixed(2)}</strong></td>
                    </tr>
                </table>

                <div class="signature-section">
                    <div style="margin-bottom: 5px;">Certified that the particulars given above are true and correct</div>
                    <div style="margin-bottom: 40px; font-weight: bold;">For, ${safe(supplierDetails.firmName)}</div>
                    ${signatureSrc ? `<img src="${signatureSrc}" class="sig-img" />` : '<div style="height: 40px;"></div>'}
                    <div style="border-top: 1px solid #000; display: inline-block; padding-top: 5px;">Authorised Signatory</div>
                </div>
            </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

// --- Main Export Function ---

export const generateInvoicePDF = async (invoiceData) => {
  try {
    const ok = await requestStoragePermission();
    if (!ok) {
      Alert.alert("Permission Denied", "Storage permission required to save PDF.");
      return null;
    }

    const htmlContent = await generateHTML(invoiceData);

    const fileName = `Invoice_${invoiceData.invoicePrefix || ""}${invoiceData.invoiceNumber || ""}_${Date.now()}`;
    const options = {
      html: htmlContent,
      directory: Platform.OS === "ios" ? "Documents" : "Download",
      fileName: fileName,
    };

    const file = await generatePDF(options);
    return file;
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    Alert.alert("Error", "Failed to generate PDF: " + (error?.message || error));
    return null;
  }
};