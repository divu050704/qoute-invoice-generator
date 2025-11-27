import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { generatePDF } from 'react-native-html-to-pdf';
import Colors from '../colors';

// Function to request storage permissions
const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE
      return true;
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to save PDF files',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
  }
  return true;
};

// Function to generate HTML content
export const generateHTML = (data) => {
  const {
    quotationDate,
    quotationPrefix,
    quotationNumber,
    supplierDetails,
    buyerDetails,
    contactPersonDetails,
    productDetails,
    termsAndConditions,
  } = data;

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const productRows = productDetails.map((product) => {
    const amount = parseFloat(product.amount) || 0;
    const taxableAmount = parseFloat(product.taxableAmount) || 0;
    const totalAmount = parseFloat(product.totalAmount) || 0;
    const gstRate = parseFloat(product.gstRate) || 0;
    
    const tax = (taxableAmount * gstRate) / 100;
    const discount = amount - taxableAmount;
    
    subtotal += amount;
    totalTax += tax;
    totalDiscount += discount;

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${product.productName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${product.description || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.hsn || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.unit}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${parseFloat(product.unitPrice).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${amount.toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.discount || '0'}${product.discountType === 'percent' ? '%' : ''}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${gstRate}%</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${totalAmount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const grandTotal = subtotal - totalDiscount + totalTax;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { color: #333; font-size: 24px; margin-bottom: 5px; }
        .quotation-info { text-align: right; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 14px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .details-box { border: 1px solid #ddd; padding: 15px; background: #f9f9f9; }
        .detail-row { margin-bottom: 8px; }
        .detail-label { font-weight: bold; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #333; color: white; padding: 10px; text-align: left; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        .totals { margin-top: 20px; }
        .totals-table { width: 300px; margin-left: auto; }
        .totals-table td { padding: 8px; border: 1px solid #ddd; }
        .totals-table .total-row { font-weight: bold; background-color: #f0f0f0; }
        .terms { margin-top: 20px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
        .terms pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>QUOTATION</h1>
      </div>

      <div class="quotation-info">
        <strong>Quotation No:</strong> ${quotationPrefix}${quotationNumber}<br>
        <strong>Date:</strong> ${quotationDate}
      </div>

      <div class="section">
        <div class="section-title">Supplier Details</div>
        <div class="details-box">
          <div class="detail-row"><span class="detail-label">Firm Name:</span> ${supplierDetails.firmName}</div>
          <div class="detail-row"><span class="detail-label">GSTIN:</span> ${supplierDetails.gstin}</div>
          <div class="detail-row"><span class="detail-label">PAN:</span> ${supplierDetails.pancard}</div>
          <div class="detail-row"><span class="detail-label">Email:</span> ${supplierDetails.email}</div>
          <div class="detail-row"><span class="detail-label">Mobile:</span> ${supplierDetails.mobile}</div>
          <div class="detail-row"><span class="detail-label">Address:</span> ${supplierDetails.address}, ${supplierDetails.city}, ${supplierDetails.state} - ${supplierDetails.pincode}</div>
        </div>
      </div>

      <div class="section">
        <div class="details-grid">
          <div>
            <div class="section-title">Buyer Details</div>
            <div class="details-box">
              <div class="detail-row"><span class="detail-label">Company Name:</span> ${buyerDetails.companyName}</div>
              <div class="detail-row"><span class="detail-label">GSTIN:</span> ${buyerDetails.gstin}</div>
              <div class="detail-row"><span class="detail-label">GST Treatment:</span> ${buyerDetails.gstTreatmentType}</div>
              <div class="detail-row"><span class="detail-label">Email:</span> ${buyerDetails.email}</div>
              <div class="detail-row"><span class="detail-label">Mobile:</span> ${buyerDetails.mobileNumber}</div>
              <div class="detail-row"><span class="detail-label">Address:</span> ${buyerDetails.address}, ${buyerDetails.city}, ${buyerDetails.state} - ${buyerDetails.pincode}</div>
            </div>
          </div>
          <div>
            <div class="section-title">Contact Person</div>
            <div class="details-box">
              <div class="detail-row"><span class="detail-label">Name:</span> ${contactPersonDetails.name}</div>
              <div class="detail-row"><span class="detail-label">Email:</span> ${contactPersonDetails.email}</div>
              <div class="detail-row"><span class="detail-label">Phone:</span> ${contactPersonDetails.phone}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Product Details</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>GST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount:</td>
            <td style="text-align: right;">₹${totalDiscount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>GST:</td>
            <td style="text-align: right;">₹${totalTax.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>Grand Total:</td>
            <td style="text-align: right;">₹${grandTotal.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${termsAndConditions ? `
        <div class="terms">
          <div class="section-title">Terms and Conditions</div>
          <pre>${termsAndConditions}</pre>
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

// Main function to generate and save PDF
export const generateQuotationPDF = async (quotationData) => {
  try {
    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required to save PDF');
      return null;
    }

    // Generate HTML content
    const htmlContent = generateHTML(quotationData);

    // Define file name
    const fileName = `Quotation_${quotationData.quotationPrefix}${quotationData.quotationNumber}_${Date.now()}`;
    
    // Generate PDF
    const options = {
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Download',
      base64: false,
    };

    const file = await generatePDF(options);

    return file    
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    return null;
  }
};
