import { GraniteBlock } from './GraniteBlock';

/**
 * Interface for Commercial Invoice (International Export)
 * Extends the base invoice with USD pricing, exchange rates, and export-specific fields
 */
export interface CommercialInvoice {
  // Basic Invoice Info
  id: string;
  invoiceNo: string;
  invoiceDate: string; // ISO date string

  // Exporter Details
  exporterName: string;
  exporterAddress: string;
  gstin: string;
  stateCode: string;
  iecNo: string;
  panNo: string;
  lutArn: string;

  // Consignee & Buyer Details
  consigneeName: string;
  consigneeAddress: string;
  buyersOrderNumber: string;
  buyersOrderDate: string;

  // Shipping Details
  shippingBillNo: string;
  shippingBillDate: string;
  portCode: string;
  preCarrierBy: string;
  placeReceiptByCarrier: string;
  countryOfOrigin: string;
  countryOfDestination: string;
  vesselFlightNo: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  termsOfDeliveryPayment: string;
  paymentTerms: string;

  // BL Details
  blNo: string;
  blDate: string;

  // Product Details
  gpType: string;
  hsn: string;
  graniteStocks: GraniteBlock[];
  shippingMark: string;
  noOfBlocks: number;
  blockRangeStart: string;
  blockRangeEnd: string;

  // Pricing (USD)
  ratePerMtUsd: number;
  totalQuantityMt: number;
  totalAmountUsd: number;

  // Exchange Rate & INR Conversion
  exchangeRateUsdToInr: number;
  invoiceValueInr: number;

  // Tax (IGST for exports)
  igstRate: number;
  igstAmountInr: number;

  // Totals
  totalCbm: number;
  grandTotalUsd: number;

  // Bank Details
  bankAccountNo: string;
  bankName: string;
  adCode: string;

  // Additional
  lastModifiedDate: string;
  notes: string;
}

/**
 * Helper function to create a CommercialInvoice from a regular Invoice
 */
export function createCommercialInvoiceFromInvoice(
  invoice: any, // Your existing Invoice type
  additionalData: Partial<CommercialInvoice>
): CommercialInvoice {
  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    invoiceDate: invoice.dated || new Date().toISOString(),

    // Exporter Details - defaults for Dolphin International
    exporterName: 'DOLPHIN INTERNATIONAL',
    exporterAddress:
      'NO 2/10, 4TH FLOOR, 80FT ROAD,\nOPPOSITE RAMAIAH HOSPITAL,\nRMV 2ND STAGE BANGALORE 560 094\nKARNATAKA, INDIA.',
    gstin: invoice.gstin || '29AABFD0471D1ZV',
    stateCode: '29',
    iecNo: '0798015888',
    panNo: 'AABFD0471D',
    lutArn: additionalData.lutArn || '',

    // Consignee
    consigneeName: invoice.billTo || 'XIAMEN JINGTAIQUAN INDUSTRIAL CO.,LTD',
    consigneeAddress:
      invoice.billToAddress ||
      'ADD: - UNIT 1506,NO 21, NORTH SHUANGSHI\nROAD, XIAMEN AREA OF CHINA(FUJIAN)\nPILOT FREE, TRADE ZONE.',
    buyersOrderNumber: invoice.buyersOrderNumber || '',
    buyersOrderDate: additionalData.buyersOrderDate || '',

    // Shipping
    shippingBillNo: invoice.shippingBillno || '',
    shippingBillDate: invoice.shippingBillDate || '',
    portCode: invoice.portCode || '',
    preCarrierBy: invoice.preCarrierBy || 'ROAD',
    placeReceiptByCarrier:
      invoice.placeReceiptbyCarrier || 'KRISHNAPATNAM PORT, INDIA',
    countryOfOrigin: 'INDIA',
    countryOfDestination: invoice.country || 'CHINA',
    vesselFlightNo: invoice.vesselorflightno || '',
    portOfLoading: invoice.portofLoading || 'KRISHNAPATNAM PORT, INDIA',
    portOfDischarge: invoice.portofDischarge || '',
    finalDestination: invoice.destination || 'CHINA',
    termsOfDeliveryPayment: 'F.O.B. KRISHNAPATNAM PORT, INDIA',
    paymentTerms: 'PAYMENT TT AFTER EMAIL COPY OF ORIGINAL BILL OF LADING.',

    // BL
    blNo: additionalData.blNo || '',
    blDate: additionalData.blDate || '',

    // Product
    gpType: invoice.gpType || 'Granite - Roughly Trimmed Blocks',
    hsn: invoice.hsn || '25161100',
    graniteStocks: invoice.graniteStocks || [],
    shippingMark: additionalData.shippingMark || 'FAN / XMN',
    noOfBlocks: invoice.graniteStocks?.length || 0,
    blockRangeStart: additionalData.blockRangeStart || '',
    blockRangeEnd: additionalData.blockRangeEnd || '',

    // Pricing
    ratePerMtUsd: additionalData.ratePerMtUsd || 1.0,
    totalQuantityMt: additionalData.totalQuantityMt || 0,
    totalAmountUsd: additionalData.totalAmountUsd || 0,

    // Exchange
    exchangeRateUsdToInr: additionalData.exchangeRateUsdToInr || 84.5,
    invoiceValueInr: additionalData.invoiceValueInr || 0,

    // Tax
    igstRate: additionalData.igstRate || 5,
    igstAmountInr: additionalData.igstAmountInr || 0,

    // Totals
    totalCbm: additionalData.totalCbm || 0,
    grandTotalUsd: additionalData.grandTotalUsd || 0,

    // Bank
    bankAccountNo: additionalData.bankAccountNo || '54045310226',
    bankName: additionalData.bankName || 'State Bank of India',
    adCode: additionalData.adCode || '0008577',

    // Additional
    lastModifiedDate:
      additionalData.lastModifiedDate || new Date().toISOString(),
    notes: invoice.notes || '',
  };
}
