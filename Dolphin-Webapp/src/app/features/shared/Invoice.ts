import { GraniteBlock } from './GraniteBlock';

export interface Invoice {
  id: string;
  billTo: string;
  billToAddress: string;
  country: string;
  dispatchDate: string; // ISO date string
  gatePassNo: string;
  gpType: string;
  graniteStocks: GraniteBlock[];
  gstin: string;
  notes: string;
  phone: string;
  placeOfDispatch: string;
}
