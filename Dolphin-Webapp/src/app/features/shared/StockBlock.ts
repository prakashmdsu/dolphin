export interface Measurement {
  lg: number;
  wd: number;
  ht: number;
}

export interface StockGraniteBlock {
  id: string;
  date: string; // or Date if you parse it
  pitNo: number;
  blockNo: number;
  buyerBlockNo: number;
  categoryGrade: string;
  measurement: Measurement;
  status: string | null; // based on your JSON
  updatedDate: string | null; // ISO date string or Date
  note: string;
  enteredBy: string | null;
  preAllowance: number | null;
  allowanceType: string | null;
  tonnageAllowance: number | null;
  quarryCbm?: number;
  dmgTonnage?: number;
  netCbm?: number;
}
