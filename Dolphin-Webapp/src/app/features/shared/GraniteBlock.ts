export interface GraniteBlock {
  date?: string;
  pitNo?: number;
  blockNo: number;
  buyerBlockNo?: number;
  hsn?: string;
  measurement: {
    lg: number;
    wd: number;
    ht: number;
  };
  categoryGrade: string;
  status?: string | null;
  quarryCbm?: number;
  dmgTonnage?: number;
  netCbm?: number;
  itemDescription?: string;
  permitNo?: string;
  uom?: string;
  note?: string;
}
