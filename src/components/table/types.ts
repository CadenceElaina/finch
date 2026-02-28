export interface Data {
  id?: number | string;
  symbol: string;
  name?: string;
  price: number;
  priceChange: number;
  percentChange: number;
  article?: { title: string; source: string; time: string };
  followers?: string;
}

// Define a union type for allowed field names
export type AllowedFields =
  | "id"
  | "symbol"
  | "name"
  | "article"
  | "price"
  | "priceChange"
  | "percentChange"
  | "followers";

export interface TableProps {
  data: Data[];
  config: RowConfig;
  full: boolean;
  icon: boolean;
  onIconClick?: (symbol: string) => void;
}

export interface RowConfig {
  fields: string[]; // Fields to display in each row
  addIcon?: boolean; // Whether to display the add icon
  removeIcon?: boolean;
  name?: string;
}
