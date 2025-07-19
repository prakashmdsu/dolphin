import { Client } from './Client';
import { StockGraniteBlock } from './StockBlock';

export interface PreBilling {
  clients: Client[];
  graniteStockBlocks: StockGraniteBlock[];
  gpTypes: string[];
}
