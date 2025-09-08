import { GraniteBlock } from './GraniteBlock';

export interface Invoice {
  id: string;
  invoiceNo: string;
  billTo: string;
  billToAddress: string;
  buyersOrderNumber: string;
  country: string;
  deliveryNoteDate: string; // ISO date string
  destination: string;
  dispatchDate: string; // ISO date string
  dispatchedThrough: string;
  driverContactNo: string;
  driverName: string;
  ewayBillNo: string;
  gatePassNo: string;
  gpType: string;
  graniteStocks: GraniteBlock[];
  gstin: string;
  notes: string;
  otherReference: string;

  phone: string;
  placeOfDispatch: string;
  supplierRef: string;
  tansporterContactNo: string;
  termsOfPayment: string;
  vehicleNo: string;
  termsOfDelivery: string;
  dispatchDocumentNo: string;
  dated: string;
  hsn: string;
  permitNo: string;
}
