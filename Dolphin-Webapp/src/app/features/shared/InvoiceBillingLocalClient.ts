// Individual item interface for multiple items scenario
export interface InvoiceItem {
  description: string;
  details?: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

// Main tax invoice interface
export interface TaxInvoice {
  // Invoice Header Information
  proformaInvoiceNo?: string;
  invoiceNo: string;
  invoiceDate: Date | string;
  deliveryNote?: string;
  deliveryNoteDate?: Date | string;
  suppliersRef?: string;
  buyersOrderNo?: string;
  despatchDocNo?: string;
  despatchedThrough?: string;
  paymentTerms?: string;
  otherReferences?: string;
  destination?: string;

  // Bill To Information
  billToName: string;
  billToAddress: string;
  billToGSTIN: string;
  billToStateName: string;

  // Transport Details
  eWayBillNo?: string;
  termsOfDelivery?: string;
  motorVehicleNo?: string;

  // Single Item Details (for simple invoices)
  itemDescription?: string;
  itemDetails?: string;
  hsnCode?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  amount?: number;

  // Multiple Items (alternative to single item)
  items?: InvoiceItem[];

  // Tax Calculations
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent?: number; // For inter-state transactions
  igstAmount?: number;
  roundedOff?: number;
  
  // Totals
  totalQuantity: number;
  totalAmount: number;
  taxableValue: number;
  totalTaxAmount: number;
  totalTaxableValue: number;
  totalCgstAmount: number;
  totalSgstAmount: number;
  totalIgstAmount?: number;
  grandTotalTaxAmount: number;

  // Amount in Words
  amountInWords: string;
  taxAmountInWords: string;

  // Bank Details
  beneficiaryName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;

  // Additional Details
  totalDmgCharges?: string;
  companyPAN: string;

  // Optional fields for notes and references
  notes?: string;
  terms?: string;
  declaration?: string;
}

// Company information interface (can be used for sender/company details)
export interface CompanyInfo {
  name: string;
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    state: string;
    pincode: string;
  };
  gstin: string;
  stateCode: string;
  email: string;
  phone?: string;
  pan: string;
}

// Tax rate configuration interface
export interface TaxRates {
  cgst: number;
  sgst: number;
  igst?: number;
  cess?: number;
}

// HSN/SAC code with tax details
export interface HSNDetails {
  code: string;
  description: string;
  taxRates: TaxRates;
  uom: string; // Unit of measurement
}

// Payment terms interface
export interface PaymentTerms {
  type: 'CASH' | 'CREDIT' | 'ADVANCE' | 'CHEQUE' | 'BANK_TRANSFER';
  days?: number; // Credit days if applicable
  dueDate?: Date | string;
  description?: string;
}

// Transport details interface (extended)
export interface TransportDetails {
  eWayBillNo?: string;
  transporterName?: string;
  transporterId?: string;
  vehicleNo?: string;
  vehicleType?: string;
  driverName?: string;
  driverLicense?: string;
  lrNo?: string; // Lorry Receipt Number
  lrDate?: Date | string;
  freightCharges?: number;
  distanceKm?: number;
  fromPlace: string;
  toPlace: string;
  termsOfDelivery: string;
}

// Complete invoice with all details (comprehensive interface)
export interface CompleteTaxInvoice extends TaxInvoice {
  // Company details
  company: CompanyInfo;
  
  // Customer/Bill to details (extended)
  customer: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      line3?: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    stateCode: string;
  };

  // Extended transport details
  transport: TransportDetails;

  // Payment information
  payment: PaymentTerms;

  // Additional metadata
  metadata?: {
    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
    version: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
    invoiceType: 'TAX_INVOICE' | 'PROFORMA' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
  };
}

// Validation interface for required fields
export interface InvoiceValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Interface for invoice calculations
export interface InvoiceCalculations {
  subTotal: number;
  totalTax: number;
  grandTotal: number;
  totalInWords: string;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    igst?: number;
    cess?: number;
  };
}

// Export configuration interface
export interface PDFExportOptions {
  filename?: string;
  includeWatermark?: boolean;
  watermarkText?: string;
  headerColor?: string;
  showBankDetails?: boolean;
  showTransportDetails?: boolean;
  customFooter?: string;
  pageFormat?: 'A4' | 'A3' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
}