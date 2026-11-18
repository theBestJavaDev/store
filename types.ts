export type ProductCategory =
  | 'Bearings'
  | 'Shaft Collars'
  | 'Shafting'
  | 'Fasteners & Spacers'
  | 'FTC Motion & Intakes'
  | 'Bundles'
  | 'Custom Plates';

export interface FTCProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  packSize: string;
  competitorPrice: number;
  price: number;
  specs: string;
  toleranceBadge: string;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  metaNote?: string;
}

export type PlateMaterialKey = 'alu_2mm' | 'poly_3mm' | 'delrin_3mm';

export interface PlateQuoteResult {
  materialLabel: string;
  areaSqIn: number;
  unitCutCost: number;
  setupFee: number;
  pairDiscount: number;
  totalPrice: number;
}
