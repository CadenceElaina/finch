import { IconType } from "react-icons";

export interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  auth?: boolean;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SidebarItemProps {
  label: string;
  icon: IconType;
  href?: string;
  onClick?: () => void;
  auth?: boolean;
}
