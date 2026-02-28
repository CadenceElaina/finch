import { IconType } from "react-icons";

export interface Data {
  symbol: string;
  name: string;
  price: number;
  percentChange: number;
}

export interface discoverMoreProps {
  data: Data[];
  icon?: IconType;
}
export interface ArrowProps {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}
