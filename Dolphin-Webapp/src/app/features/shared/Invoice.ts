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

// export interface GraniteStock {
//   blockNo: number;
//   categoryGrade: string;
//   dmgTonnage: number;
//   hsn: string;
//   itemDescription: string;
//   measurement: Measurement;
//   netCBM: number;
//   permitNo: string;
//   quarryCBM: number;
//   uom: string;
// }

// export interface Measurement {
//   lg: number;
//   wd: number;
//   ht: number;
// }
