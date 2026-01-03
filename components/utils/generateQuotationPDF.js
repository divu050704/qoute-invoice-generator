// pdfGenerator.js - Fixed spacing issues
import { Alert, Platform, PermissionsAndroid } from "react-native";
import { generatePDF } from "react-native-html-to-pdf";
import Colors from "../colors";
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

  const supplierImageSrc = await uriToDataUri(supplierDetails.image);
  const signatureSrc = await uriToDataUri(signature);

  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  const showGSTColumns = (productDetails || []).some(p => !p?.taxInclusive);
  const productRows = (productDetails || [])
    .map((product, index) => {
      const {
        productName = "",
        description = "",
        quantity = 0,
        hsn = "",
        unitPrice = 0,
        unit = "PCS",
        amount = 0,
        discount = "",
        discountType = "percent",
        taxableAmount = 0,
        taxInclusive = false,
        gstRate = "0",
        totalAmount = 0,
      } = product || {};

      const qty = parseFloat(quantity) || 0;
      const unitP = parseFloat(unitPrice) || 0;
      const amt = parseFloat(amount) || qty * unitP || 0;
      const gst = parseFloat(gstRate) || 0;
      const taxAmt = (parseFloat(taxableAmount) || amt) * (gst / 100);
      const disc =
        discount === "" || discount == null
          ? 0
          : discountType === "percent"
          ? (amt * (parseFloat(discount) || 0)) / 100
          : parseFloat(discount) || 0;

      subtotal += amt;
      totalTax += taxAmt;
      totalDiscount += disc;

      const displayedUnitPrice = unitP.toFixed(2);
      const displayedAmount = amt.toFixed(2);
      const displayedTotalAmount = (
        parseFloat(totalAmount) || amt - disc + taxAmt
      ).toFixed(2);
      const halfGstRate = gst / 2;
      const halfGstAmount = taxAmt / 2;

     return `
<tr>
  <td style="text-align:center; vertical-align: middle;">${index + 1}</td>

  <td>
    <p>${productName}</p>
    <p style="font-size: 8px">${description}</p>
  </td>

  <td style="text-align:center; vertical-align: middle;">${hsn || "-"}</td>
  <td style="text-align:center; vertical-align: middle;">${qty}</td>
  <td style="text-align:center; vertical-align: middle;">${unit || "PCS"}</td>

  <td style="text-align:center; vertical-align: middle;">₹${unitP.toFixed(2)}</td>

  ${
    showGSTColumns
      ? `
        <td style="text-align:center; vertical-align: middle;">₹${amt.toFixed(2)}</td>

        <!-- SGST -->
        <td style="text-align:center; vertical-align: middle;">${halfGstRate}.00%</td>
        <td style="text-align:center; vertical-align: middle;">₹${halfGstAmount.toFixed(2)}</td>

        <!-- CGST -->
        <td style="text-align:center; vertical-align: middle;">${halfGstRate}.00%</td>
        <td style="text-align:center; vertical-align: middle;">₹${halfGstAmount.toFixed(2)}</td>
      `
      : ""
  }

  <td style="text-align:center; vertical-align: middle;">₹${displayedTotalAmount}</td>
</tr>
`;

    })
    .join("");

  const grandTotal = subtotal - totalDiscount + totalTax;

  const safe = (v) => v || "-";

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
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sofia+Sans+Extra+Condensed:ital,wght@0,1..1000;1,1..1000&display=swap');
        /* Narrower page margins so left/right space is reduced */
        @page { size: A4; margin: 6mm; }

        /* Reset */
        *{box-sizing:border-box; margin:0; padding:0;}
        html,body{height:100%;}
        body{
          font-family: Arial, sans-serif;
          color:#000;
          font-size:10px;
          line-height:1.25;
          background:#fff;
          padding:0;
          margin:0;
          /* Use a full-width container to make best use of page real estate */
        }

        /* outer container to control horizontal padding (kept small) */
        .page-wrap{width:100%; padding:4mm 4mm; /* small inner breathing space */}

        /* Header - more compact */
        .header-container{
          display:flex;
          justify-content:space-between;
          align-items: center;
          border-bottom: 2px solid #D3D3D3;
          padding-bottom:8px;
          margin-bottom:8px;
          gap:8px;
          
        }
        .left-header{display:flex; gap:8px; align-items:flex-start; min-width:180px;}
        .logo-img{width:64px; height:64px; object-fit:contain;}
        .quotation-title{
          font-size:34px; /* slightly smaller so it doesn't push layout */
          font-weight:500;
          font-family: "Sofia Sans Extra Condensed", sans-serif;
          color:#000;
          font-style:italic;
        }
          line-height:1;
          text-align:right;
        }

        /* Company/meta row - compact and full width */
        .info-row{display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; gap:12px}
        .company-section{flex:1; min-width:220px;}
        .company-name{font-size:18px; font-weight:400; color:#000; margin-bottom:3px; }
        .company-section p{margin:1px 0; font-size:9px; color:#000;}

        .meta-box{min-width:160px; text-align:right; font-size:9px;}
        .meta-box div{margin:2px 0; color:#000; font-style:italic;}

        /* Two columns compact */
        .two-col{display:flex; gap:12px; margin:10px 0; align-items:flex-start;}
        .two-col > div{flex:1; min-width:160px;}
        .section-label{font-size:14px; font-weight:500; margin-bottom:6px; color:#000; font-style:italic;}
        .two-col p{margin:2px 0; font-size:9px; color:#000;}

        /* Product Table - use maximum width and tighter cells */
        .product-section{margin:8px 0; /* reduced margin to fit more content */ }
        .price-table{width:100%; border-collapse:collapse; background:#fff; word-wrap:break-word}
        .price-table th{
          background: #F1F1F1;
          color:#000;
          padding:6px 6px;
          text-align:left;
          font-size:9px;
          font-weight:700;
          border:1px solid #BEBEBE;
          
        }
        .price-table td{
          padding:6px 6px;
          border:1px solid #BEBEBE;
          font-size:9px;
          vertical-align:top;
        }

        /* Make product description take available space and avoid huge gaps */
        .price-table td:nth-child(1){width:4%; text-align:center;}
.price-table td:nth-child(2){width:28%;}
.price-table td:nth-child(3){width:8%; text-align:center;}
.price-table td:nth-child(4){width:6%; text-align:center;}
.price-table td:nth-child(5){width:6%; text-align:center;}
.price-table td:nth-child(6){width:10%; text-align:right;}
.price-table td:nth-child(7){width:10%; text-align:right;}
.price-table td:nth-child(8){width:6%; text-align:center;}
.price-table td:nth-child(9){width:8%; text-align:right;}
.price-table td:nth-child(10){width:6%; text-align:center;}
.price-table td:nth-child(11){width:8%; text-align:right;}
.price-table td:nth-child(12){width:10%; text-align:right;}



        /* Placeholder smaller and less empty-looking */
        .placeholder-text{
          color:#8a8a8a;
          padding:18px;
          text-align:center;
          font-size:14px;
          font-weight:400;
          border:1px dashed #ddd;
        }

        /* Totals Section - align compactly on the right; expand numbers area */
        .totals-row{display:flex; gap:12px; margin:12px 0; align-items:flex-start; border-width: 2px; border-color: #000;}
        .total-words{flex:1; border:1px solid #000; padding:10px; min-height:60px;}
        .total-words-label{font-size:11px; font-weight:600; margin-bottom:6px; color: #000; font-style:italic;}
        .total-words-text{font-size:9px; color:#000; line-height:1.3;}

        .total-numbers{border:1px solid #000; padding:10px; min-width:220px;}
        .total-numbers-label{font-size:11px; font-weight:600; margin-bottom:6px; color:#000; font-style:italic;}
        .total-line{display:flex; justify-content:space-between; margin:4px 0; font-size:10px; color:#000;}
        .total-line.grand{font-weight:700; font-size:11px; margin-top:6px; padding-top:6px; border-top:1.5px solid #000;}

        /* Footer grid - shrink T&C height so page doesn't feel sparse */
        .footer-grid{
          display:grid;
          grid-template-columns:1fr 320px;
          gap:10px;
          margin-top:12px;
          align-items:start;
        }
        .tc-box{grid-column:1; border:1px solid #000; padding:10px; min-height:120px; max-height:220px; overflow:auto;}
        .tc-label{font-size:11px; font-weight:700; margin-bottom:6px; color:#000; font-style:italic;}
        .tc-content{font-size:9px; white-space:pre-wrap; color:#000; line-height:1.3;}

        .bank-box{border:1px solid #000; padding:10px; min-height:60px;}
        .bank-label{font-size:11px; font-weight:700; margin-bottom:6px; color:#000; font-style:italic;}
        .bank-detail{margin:3px 0; font-size:9px; color:#000;}

        .signature-box{border:1px solid #000; padding:10px; text-align:center; min-height:80px;}
        .sig-label{font-size:10px; font-weight:700; margin-bottom:6px; color:#000; font-style:italic;}
        .sig-img{max-width:140px; max-height:40px; object-fit:contain; margin:6px 0;}
        .auth-sig{font-size:10px; font-weight:700; margin-top:18px; color:#000; font-style:italic;}

        /* Small helpers to reduce empty whitespace on short product lists */
        .force-fill {
          /* A small visual trick: if content is short, this element forces table area to appear fuller */
          display:block;
          width:100%;
          height:18px;
        }

        /* Print safe - ensure content uses nearly full width */
        table, tr, td, th { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="page-wrap">
        <!-- Header with Logo and Quotation Title -->
        <div class="header-container">
          <div class="left-header">
            ${
              supplierImageSrc
                ? `<img class="logo-img" src="${supplierImageSrc}" alt="Logo" />`
                : ""
            }
            
          </div>
          <div class="quotation-title">Quotation</div>
        </div>

        <!-- Company Info and Meta Box in Same Row -->
        <div class="info-row">
        <div style="font-size:11px; display:flex; align-items:flex-start; width:100%; margin-top: 15px">
  
  <!-- LEFT -->
  <div style="display:flex; flex-direction:column;">
    
    <div>
      <div class="company-name">${safe(supplierDetails.firmName)}</div>
      <div style="font-size:14px; font-weight:400; max-width:45vw;">
        ${safe(supplierDetails.address)}
      </div>
    </div>

    <div class="company-section">
      <p style="font-size:14px">${safe(supplierDetails.email)}</p>
      <p style="font-size:14px">${safe(supplierDetails.mobile)}</p>
      ${
        supplierDetails.gstin &&
        `<p style="font-size:14px">${safe(supplierDetails.gstin)}</p>`
      }
      <p style="font-size:14px">${safe(supplierDetails.pancard)}</p>
    </div>

  </div>

  <!-- RIGHT -->
  <div class="meta-box" style="margin-left:auto; text-align:right; font-size:12px;">
    <div><strong>Quotation No:</strong> ${safe(quotationPrefix)}${safe(
    quotationNumber
  )}</div>
    <div><strong>Date:</strong> ${safe(quotationDate)}</div>
    <div><strong>Valid Till:</strong> ${safe(quotationValidity)}</div>
  </div>

</div>


        <!-- Quotation For / Ship To -->
        <!-- Quotation For / Ship To -->
<div class="two-col">
  <div style="min-width: 60vw">
    <div class="section-label">Quotation For:</div>

    <p style="font-size:14px">${safe(buyerDetails.companyName)}</p>

    <p style="font-size:14px">
      ${safe(buyerDetails.address)}, ${safe(buyerDetails.city)} - ${safe(
    buyerDetails.pincode
  )}
    </p>
    <p style="font-size:14px">${safe(buyerDetails.mobileNumber)}</p>

    ${
      buyerDetails.email &&
      `<p style="font-size:14px">${safe(buyerDetails.email)}</p>`
    }


    ${
      buyerDetails.gstin &&
      `<p style="font-size:14px">${safe(buyerDetails.gstin)}</p>`
    }
  </div>

  <div>
    <div class="section-label">Ship To:</div>

    <p style="font-size:14px">
      Name: ${safe(shipToDetails.companyName || buyerDetails.companyName)}
    </p>

    <p style="font-size:14px">
      Address: ${safe(shipToDetails.address || buyerDetails.address)},
    </p>
    <p style="font-size:14px">
      Phone Number: ${safe(
        shipToDetails.mobileNumber || buyerDetails.mobileNumber
      )}
    </p>
     ${
       (shipToDetails.email || buyerDetails.email) &&
       `<p style="font-size:14px">Email: ${safe(
         shipToDetails.email || buyerDetails.email
       )}</p>`
     }

    

    ${
      (shipToDetails.gstin || buyerDetails.gstin) &&
      `<p style="font-size:14px">GSTIN: ${safe(
        shipToDetails.gstin || buyerDetails.gstin
      )}</p>`
    }
  </div>
</div>


        <!-- Product Table -->
        <div class="product-section">
          ${
            productRows
              ? `
          <table class="price-table">
            <thead>
  ${
    showGSTColumns
      ? `
<tr>
  <th rowspan="2" style="text-align:center;">Sr. No.</th>
  <th rowspan="2" style="text-align:center;">Name of Product</th>
  <th rowspan="2" style="text-align:center;">HSN/SAC</th>
  <th rowspan="2" style="text-align:center;">Qty</th>
  <th rowspan="2" style="text-align:center;">Unit</th>
  <th rowspan="2" style="text-align:center;">Rate</th>
  <th rowspan="2" style="text-align:center;">Taxable</th>

  <th colspan="2" style="text-align:center;">SGST</th>
  <th colspan="2" style="text-align:center;">CGST</th>

  <th rowspan="2" style="text-align:center;">Amount</th>
</tr>

<tr>
  <th style="text-align:center;">Rate</th>
  <th style="text-align:center;">Amount</th>

  <th style="text-align:center;">Rate</th>
  <th style="text-align:center;">Amount</th>
</tr>
`
      : `
<tr>
  <th style="text-align:center;">Sr. No.</th>
  <th style="text-align:center;">Name of Product</th>
  <th style="text-align:center;">HSN/SAC</th>
  <th style="text-align:center;">Qty</th>
  <th style="text-align:center;">Unit</th>
  <th style="text-align:center;">Rate</th>
  <th style="text-align:center;">Amount</th>
</tr>
`
  }
</thead>


            <tbody>
              ${productRows}
              ${
                (productDetails.length < 4 && showGSTColumns) && 
                `<tr style="height: 20px"><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>`
              }
              ${
                (productDetails.length < 4 && !showGSTColumns) &&
                `<tr style="height: 20px"><td /><td /><td /><td /><td /><td /><td /></tr>`
              }
            </tbody>
          </table>
          <div class="force-fill"></div>
          `
              : '<div class="placeholder-text">Product details go here</div>'
          }
        </div>

        <!-- Totals -->
        <div class="totals-row">
          <div class="total-words">
            <div class="total-words-label">Total in Words</div>
            <div class="total-words-text">${grandTotalInWords}</div>
          </div>
          <div class="total-numbers">
            <div class="total-numbers-label">Total in Numbers</div>
            <div class="total-line"><span>Subtotal:</span><span>₹${subtotal.toFixed(
              2
            )}</span></div>
            <div class="total-line"><span>Discount:</span><span>₹${totalDiscount.toFixed(
              2
            )}</span></div>
            <div class="total-line"><span>GST:</span><span>₹${totalTax.toFixed(
              2
            )}</span></div>
            <div class="total-line grand"><span>Grand Total:</span><span>₹${grandTotal.toFixed(
              2
            )}</span></div>
          </div>
        </div>

        <!-- Footer Grid -->
        <div class="footer-grid">
          <div class="tc-box">
            <div class="tc-label">T&C</div>
            <div class="tc-content">${
              termsAndConditions || "No terms and conditions specified."
            }</div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div class="bank-box">
              <div class="bank-label">Bank Details</div>
              <div class="bank-detail"><strong>Acc Number:</strong> ${safe(
                bankDetails.accountNumber
              )}</div>
              <div class="bank-detail"><strong>IFSC:</strong> ${safe(
                bankDetails.ifscCode
              )}</div>
              <div class="bank-detail"><strong>Branch:</strong> ${safe(
                bankDetails.branchName || bankDetails.bankName
              )}</div>
            </div>

            <div class="signature-box">
              <div class="sig-label">For ${safe(supplierDetails.firmName)}</div>
              ${
                signatureSrc
                  ? `<img class="sig-img" src="${signatureSrc}" alt="Signature" />`
                  : '<div style="height:28px"></div>'
              }
              <div class="auth-sig">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

export const generateQuotationPDF = async (quotationData) => {
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

    const fileName = `Quotation_${quotationData.quotationPrefix || ""}${
      quotationData.quotationNumber || ""
    }_${Date.now()}`;
    const options = {
      html: htmlContent,
      directory: Platform.OS === "ios" ? "Documents" : "Download",
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
