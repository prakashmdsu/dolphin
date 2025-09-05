// Client.ts interface
export interface Client {
  id?: string;
  clientName: string;
  clientType: 'INDIAN' | 'INTERNATIONAL';
  gstin?: string;
  panNumber?: string;
  phone: string;
  country: string;
  address: string;
  state?: {
    name: string;
    code: number;
  } | null;
  stateName?: string | null;
  stateCode?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}