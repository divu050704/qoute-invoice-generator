// generateInvoicePDF.js
import { Alert, Platform, PermissionsAndroid } from "react-native";
import { generatePDF } from "react-native-html-to-pdf";
import * as RNFS from "react-native-fs";

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

export const generateHTML = async (data) => {
  const {
    quotationDate = "",
    quotationPrefix = "",
    quotationNumber = "",
    supplierDetails = {},
    buyerDetails = {},
    shipToDetails = {},
    productDetails = [],
    termsAndConditions = "",
    bankDetails = {},
    quotationValidity = "",
    signature = "",
  } = data || {};

  const signatureSrc = await uriToDataUri(signature);

  // --- Logic for State Check (IGST vs CGST/SGST) ---
  const supplierState = (supplierDetails.state || "").toLowerCase().trim();
  const supplierImageSrc = await uriToDataUri(supplierDetails.image);

  const buyerState = (buyerDetails.state || "").toLowerCase().trim();
  const isInterState =
    supplierState !== buyerState && supplierState !== "" && buyerState !== "";

  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  // Determine if we need to show tax columns at all
  const showGSTColumns = (productDetails || []).some(
    (p) => parseFloat(p?.gstRate || 0) > 0
  );

  const productRows = (productDetails || [])
    .map((product, index) => {
      const {
        productName = "",
        description = "",
        quantity = 0,
        hsn = "",
        unitPrice = 0,
        unit = "PCS",
        discount = "",
        discountType = "percent",
        taxInclusive = false,
        gstRate = "0",
      } = product || {};

      const qty = parseFloat(quantity) || 0;
      const rate = parseFloat(unitPrice) || 0;
      const gstPercent = parseFloat(gstRate) || 0;

      // 1. Base Amount
      let baseAmt = qty * rate;

      // 2. Calculate Discount
      let discAmt = 0;
      if (discount !== "" && discount !== null) {
        if (discountType === "percent") {
          discAmt = baseAmt * (parseFloat(discount) / 100);
        } else {
          discAmt = parseFloat(discount);
        }
      }

      // 3. Calculate Taxable Value
      let actualTaxable = baseAmt - discAmt;

      if (taxInclusive) {
        actualTaxable = actualTaxable / (1 + gstPercent / 100);
      }

      // 4. Calculate Tax Amount
      const taxVal = actualTaxable * (gstPercent / 100);

      // 5. Line Total
      const lineTotal = actualTaxable + taxVal;

      // Accumulate totals
      subtotal += baseAmt;
      totalDiscount += discAmt;
      totalTax += taxVal;

      // Formatting for Display
      const halfRate = gstPercent / 2;
      const halfTax = taxVal / 2;

      // Generate Tax Column HTML based on State
      let taxColumnsHTML = "";
      // In the product mapping, change taxColumnsHTML to:
      if (showGSTColumns) {
        if (isInterState) {
          taxColumnsHTML = `
            <td>${gstPercent.toFixed(2)}%</td>
            <td>${taxVal.toFixed(2)}</td>
          `;
        } else {
          taxColumnsHTML = `
            <td>${halfRate.toFixed(2)}%</td>
            <td>${halfTax.toFixed(2)}</td>
            <td>${halfRate.toFixed(2)}%</td>
            <td>${halfTax.toFixed(2)}</td>
          `;
        }
      }
      return `
      <tr>
        <td>${index + 1}</td>
        <td class="text-left" style="max-width: 150px;">
          <div style="font-weight:bold;">${productName}</div>
          <div style="font-size: 8px; color: #555;">${description}</div>
        </td>
        <td>${hsn || "-"}</td>
        <td>${qty}</td>
        <td>${unit || "PCS"}</td>
        <td>${rate.toFixed(2)}</td>
        <td>${actualTaxable.toFixed(2)}</td>
        ${showGSTColumns ? taxColumnsHTML : ""}
        <td class="text-right"><strong>₹ ${lineTotal.toFixed(2)}</strong></td>
      </tr>
    `;
    })
    .join("");

  // Final Calculations
  const taxableBase = subtotal - totalDiscount;
  const rawGrandTotal = taxableBase + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = grandTotal - rawGrandTotal;

  // Tax Splits for Summary
  const sgstAmount = showGSTColumns && !isInterState ? totalTax / 2 : 0;
  const cgstAmount = showGSTColumns && !isInterState ? totalTax / 2 : 0;
  const igstAmount = showGSTColumns && isInterState ? totalTax : 0;

  const safe = (v) => v || "-";
  const totalRowHTML = `
  <tr class="total-row-table">
    <td />
    <td  class="text-right" style="font-weight: bold;">Total</td>
    <td />
    <td style="font-weight: bold;">${(productDetails || []).reduce(
      (sum, p) => sum + (parseFloat(p.quantity) || 0),
      0
    )}</td>
    <td></td>
    <td></td>
    <td style="font-weight: bold;">₹ ${taxableBase.toFixed(2)}</td>
    ${
      showGSTColumns
        ? isInterState
          ? `<td colspan="2" style="font-weight: bold;">₹ ${igstAmount.toFixed(
              2
            )}</td>`
          : `<td colspan="2" style="font-weight: bold;">₹ ${cgstAmount.toFixed(
              2
            )}</td><td colspan="2" style="font-weight: bold;">₹ ${sgstAmount.toFixed(
              2
            )}</td>`
        : ""
      }
      <td class="text-right" style="font-weight: bold;">₹ ${rawGrandTotal.toFixed(
        2
      )}</td>
    </tr>
  `;

  // Helper function to convert number to words (Indian style)
  const numberToWords = (num) => {
    if (!num || num === 0) return "Zero Rupees Only";
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convertLessThanThousand(n % 100) : "")
      );
    };
    let intPart = Math.floor(num);
    let result = "";
    if (intPart >= 10000000) {
      const crore = Math.floor(intPart / 10000000);
      result += convertLessThanThousand(crore) + " Crore ";
      intPart %= 10000000;
    }
    if (intPart >= 100000) {
      const lakh = Math.floor(intPart / 100000);
      result += convertLessThanThousand(lakh) + " Lakh ";
      intPart %= 100000;
    }
    if (intPart >= 1000) {
      const thousand = Math.floor(intPart / 1000);
      result += convertLessThanThousand(thousand) + " Thousand ";
      intPart %= 1000;
    }
    if (intPart > 0) {
      result += convertLessThanThousand(intPart);
    }
    return result.trim() + " Rupees Only";
  };

  const grandTotalInWords = numberToWords(grandTotal);

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        body { font-family: sans-serif; font-size: 10px; color: #000; margin: 0; padding: 0; border: 1px solid #000;}
        
        .header-section { margin-bottom: 10px; display: flex; align-items: center }
        .top-right-label { text-align: right; font-size: 9px; margin-bottom: 2px; }
        .greeting { font-size: 9px; font-style: italic; margin-bottom: 5px; }
        .company-name { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .company-details { font-size: 10px; line-height: 1.3; }
        
        .tax-invoice-label {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
          border: 1px solid #000;
          padding: 5px 8px;
          background: #d1e9ff;
        }

        .right-copy {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 400;
          font-style: italic;
        }

        
        /* Meta Grid like Invoice No, Date */
        .meta-grid { display: grid; grid-template-columns: auto auto; padding: 0 10px}
        .meta-item {  margin-bottom: 5px; }
        .meta-label { font-size: 9px; color: #333; }
        .meta-value { font-size: 10px; font-weight: bold; text-align: right;}
        
        /* Receiver Section */
        .receiver-section { margin-bottom: 15px; }
        .section-header { 
          font-size: 12px; 
          weight: bold; 
          font-size: 11px; 
          margin-bottom: 9px; 
          border: 1px solid #000;
          padding-bottom: 2px; 
          font-weight: bold;
          text-align: center;
          width: 100%;
          background: #d1e9ff; 
          padding: 5px 0;
        }
        .receiver-details p { margin: 2px 0; font-size: 10px; padding: 0 10px }
        
        /* Table */
        table { 
          width: 100%; 
          border-collapse: collapse; 
          border: 1px solid #000;
        }

        th { 
          border: 1px solid #000; 
          padding: 8px 4px; 
          font-size: 9px; 
          font-weight: bold; 
          text-align: center; 
          background: #d1e9ff;
        }

        td { 
          border: 1px solid #000; 
          padding: 6px 4px; 
          font-size: 9px; 
          text-align: center; 
          vertical-align: middle; 
        }

        .total-row-table {
          background: #d1e9ff;
          font-weight: bold;
        }
        .text-right { text-align: right; }
        
        /* Footer Layout */
        /* Footer Layout */
        .footer-container { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          border: 1px solid #000;
          margin-top: 0;
        }
        .footer-left { 
          border-right: 1px solid #000;
          display: flex;
          flex-direction: column;
        }
        .footer-right { 
          display: flex;
          flex-direction: column;
        }
        
        /* Amount in Words */
        .amount-words-container { 
          border-bottom: 1px solid #000; 
          padding: 8px; 
          text-align: center;
          min-height: 50px;
        }
        .amount-words { 
          
          font-size: 10px; 
          margin-bottom: 3px; 
        }
        .amount-words-value {
          font-weight: bold; 
          font-size: 12px;
        }
        
        /* Bank Details Box */
        .bank-box { 
          border-bottom: 1px solid #000; 
          padding: 8px;
        }
        .bank-title { 
          font-weight: bold; 
          font-size: 10px; 
          margin-bottom: 5px; 
          color: #0066cc;
        }
        .bank-row { 
          display: grid;
          grid-template-columns: 1fr 2fr;
          margin-bottom: 2px; 
          font-size: 9px; 
        }
        .bank-row span:first-child {
          font-weight: normal;
        }
        .bank-row span:last-child {
          font-weight: bold;
          text-align: right;
        }
        
        /* Terms Box */
        .terms-box { 
          padding: 8px;
          flex: 1;
        }
        .terms-label { 
          font-weight: bold; 
          font-size: 10px; 
          margin-bottom: 5px; 
        }
        .terms-text { 
          font-size: 8px; 
          white-space: pre-line; 
          line-height: 1.4; 
          margin-top: 2px; 
        }
        
        /* Totals Area */
        .totals-container {
          display: flex;
          flex-direction: column;
          font-weight: bold
        }
        .total-row { 
          display: grid;
          grid-template-columns: 2fr 1fr;
          border-bottom: 1px solid #000; 
          font-size: 10px; 
        }
        .total-row span:first-child {
          padding: 5px 8px; 

          text-align: left;
          border-right: 1px solid black;
        }
        .total-row span:last-child {
          text-align: right;
          padding: 5px 8px; 

          font-weight: bold;
        }
        .total-row.final { 
          font-weight: bold; 
          font-size: 10px; 
          background: #f0f0f0;
        }
        
        /* Certification and Signatory */
        .cert-sign-container {
          padding: 8px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .certification { 
          font-size: 9px; 
          margin-bottom: 5px; 
          text-align: center;
          line-height: 1.4;
        }
        .certification strong {
          font-size: 11px;
          display: block;
          margin-top: 3px;
        }
        .signatory-box { 
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .signature-space {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
        }
        .auth-sign { 
          font-size: 10px;
          text-align: center;
          padding-bottom: 5px;
        }
        .sig-img { 
          max-height: 50px; 
          object-fit: contain; 
          display: block; 
          margin: 0 auto; 
        }
      </style>
    </head>
    <body>
      
      <div class="header-section">
       
            ${
              supplierImageSrc
                ? `<img style="width: 140px; height: 100px; object-fit: contain" src="${supplierImageSrc}" alt="Logo" />`
                : ""
            }
            
        
        <div style="text-align: center">
          <div class="company-name">${safe(supplierDetails.firmName)}</div>
          <div class="company-details">
              ${safe(supplierDetails.address)}<br/>
              GSTIN: ${safe(supplierDetails.gstin)} &nbsp;|&nbsp; State: ${safe(
    supplierDetails.state
  )}
          </div>
        </div>
      </div>

      <div class="tax-invoice-label">
        <span>TAX INVOICE</span>
        <span class="right-copy">Original For Recipient</span>

      </div>

      <div class="meta-grid">
        <div class="meta-item">
            <div class="meta-label">Invoice Number</div>
        </div>
        <div class="meta-item">
            <div class="meta-value">${safe(quotationPrefix)}${safe(
    quotationNumber
  )}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">Invoice Date</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">${safe(quotationDate)}</div>
        </div>
        <div class="meta-item">
            <div class="meta-label">State</div>  
        </div>
        <div class="meta-item">
          <div class="meta-value">${safe(supplierDetails.state)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Reverse Charge</div>
        </div>
        <div class="meta-item">
          <div class="meta-value">NO</div>
        </div>
      </div>

      <div class="receiver-section">
        <div class="section-header">Details of Receiver | Billed to</div>
        <div class="receiver-details">
            <p>Name: <strong>${safe(buyerDetails.companyName)}</strong></p>
            <p>Address: ${safe(buyerDetails.address)}</p>
            <p>Mobile: ${safe(buyerDetails.mobileNumber)}</p>
            <p>GSTIN: ${safe(buyerDetails.gstin)}  </p>
            <p>State: ${safe(buyerDetails.state)}</p>
        </div>
      </div>

      <table>
        <thead>
            <tr>
                <th rowspan="2" width="5%">Sr.<br>No.</th>
                <th rowspan="2" width="25%" class="text-left">Name of Product</th>
                <th rowspan="2" width="10%">HSN/SAC</th>
                <th rowspan="2" width="6%">QTY</th>
                <th rowspan="2" width="6%">Unit</th>
                <th rowspan="2" width="8%">Rate</th>
                <th rowspan="2" width="10%">Taxable<br>Value</th>
                ${
                  showGSTColumns
                    ? isInterState
                      ? `<th colspan="2">IGST</th>`
                      : `<th colspan="2">CGST</th><th colspan="2">SGST</th>`
                    : ""
                }
                <th rowspan="2" width="12%" class="text-right">Total</th>
            </tr>
            <tr>
                ${
                  showGSTColumns
                    ? isInterState
                      ? `<th>Rate</th><th>Amount</th>`
                      : `<th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th>`
                    : ""
                }
            </tr>
        </thead>
        <tbody>
            ${productRows}
            ${totalRowHTML}
        </tbody>
      </table>

      <div class="footer-container">
        <div class="footer-left">
            <div class="amount-words-container">
                <div class="amount-words">Total Invoice Amount in words</div>
                <div class="amount-words-value">${grandTotalInWords} /-</div>
            </div>
            
            ${
              bankDetails.accountNumber
                ? `
            <div class="bank-box">
                <div  class="bank-title">
                <img style="width: 10px; height:10px" src="data:image/png;base64,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" ></img> 
                Bank and Payment Details</div>
                <div class="bank-row"><span>Account Name</span><span>${safe(
                  bankDetails.holderName
                )}</span></div>
                <div class="bank-row"><span>Account No.</span><span>${safe(
                  bankDetails.accountNumber
                )}</span></div>
                <div class="bank-row"><span>IFSC Code</span><span>${safe(
                  bankDetails.ifscCode
                )}</span></div>
                <div class="bank-row"><span>Bank Name</span><span>${safe(
                  bankDetails.bankName
                )}</span></div>
                <div class="bank-row"><span>Branch Name</span><span>${safe(
                  bankDetails.branchName
                )}</span></div>
            </div>
            `
                : ""
            }

            <div class="terms-box">
                <div class="terms-label">Terms And Conditions</div>
                <div class="terms-text">${
                  termsAndConditions ||
                  "50% advance required to confirm order, balance before delivery or after installation.\nDelivery/installation timeline: 7–10 working days.\n2-year warranty on color fading under normal use.\nWe are not responsible for wall seepage, moisture, or poor surface issues.\nNo returns after material is delivered to customer site.\nCustomization orders are non-refundable."
                }</div>
            </div>
        </div>

        <div class="footer-right">
            <div class="totals-container">
                <div class="total-row" style="background: #d1e9ff; font-weight: bold;">
                    <span style="border-right: none;" >Total Amount Before Tax</span>
                    <span>₹ ${taxableBase.toFixed(2)}</span>
                </div>
                
                ${
                  showGSTColumns
                    ? isInterState
                      ? `
                    <div class="total-row" style="border: none"><span>Add : IGST</span><span>₹ ${igstAmount.toFixed(
                      2
                    )}</span></div>
                `
                      : `
                    <div class="total-row" style="border: none; "><span style="text-align: right; border-right: 1px solid #000">Add : CGST</span><span>₹ ${cgstAmount.toFixed(
                      2
                    )}</span></div>
                    <div class="total-row"><span style="text-align: right; border-right: 1px solid #000">Add : SGST</span><span>₹ ${sgstAmount.toFixed(
                      2
                    )}</span></div>
                `
                    : ""
                }
                
                <div class="total-row" style="background: #d1e9ff; font-weight: bold;">
                    <span>Total Tax Amount</span>
                    <span>₹ ${totalTax.toFixed(2)}</span>
                </div>

                <div class="total-row" style="background: #d1e9ff; font-weight: bold;">
                    <span>Round Off Value</span>
                    <span>₹ ${roundOff.toFixed(2)}</span>
                </div>

                <div class="total-row" style="background: #d1e9ff; font-weight: bold;">
                    <span>Final Invoice Amount</span>
                    <span>₹ ${grandTotal.toFixed(2)}</span>
                </div>

                <div class="total-row">
                    <span>Balance Due</span>
                    <span>₹ ${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="cert-sign-container">
                <div class="certification">Certified that the particular given above are true and correct<br><strong>For, ${safe(
                  supplierDetails.firmName
                ).toUpperCase()}</strong></div>
                
                <div class="signatory-box">
                    <div class="signature-space">
                      ${
                        signatureSrc
                          ? `<img class="sig-img" src="${signatureSrc}" />`
                          : ""
                      }
                    </div>
                    
                    <div class="auth-sign">Authorised Signatory</div>
                </div>
            </div>
            </div>
        </div>
      </div>

    </body>
    </html>
  `;

  return html;
};

export const generateInvoicePDF = async (quotationData) => {
  try {
    const ok = await requestStoragePermission();
    if (!ok) {
      Alert.alert(
        "Permission Denied",
        "Storage permission required to save PDF."
      );
      return null;
    }

    const htmlContent = await generateHTML(quotationData);

    const fileName = `Invoice_${quotationData.quotationPrefix || ""}${
      quotationData.quotationNumber || ""
    }_${Date.now()}`;
    const options = {
      html: htmlContent,
      directory: Platform.OS === "ios" ? "Documents" : "Download",
      fileName: fileName,
    };

    const file = await generatePDF(options);
    return file;
  } catch (error) {
    console.error("Error generating PDF:", error);
    Alert.alert(
      "Error",
      "Failed to generate PDF: " + (error?.message || error)
    );
    return null;
  }
};
