import React, { ReactNode } from "react";
/* import { IconType } from "react-icons"; */

interface ButtonProps {
  active?: boolean;
  label: string;
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  fullWidth?: boolean;
  large?: boolean;
  onClick: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  outline?: boolean;
  auth?: boolean;
  noStyles?: boolean;
  trends?: boolean;
  icon?: ReactNode;
  isUpArrow?: boolean;
  isDownArrow?: boolean;
}

const CustomButton: React.FC<ButtonProps> = ({
  active,
  label,
  primary,
  secondary,
  tertiary,
  fullWidth,
  onClick,
  onCancel,
  large,
  disabled,
  outline,
  auth,
  noStyles,
  trends,
  icon,
  isUpArrow,
  isDownArrow,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent default behavior of the button
    if (onCancel) {
      onCancel(); // Call onCancel function if provided
    } else if (onClick) {
      onClick(); // Call onClick function if provided
    }
  };
  const arrowColorStyle = isUpArrow
    ? { color: "green" }
    : isDownArrow
    ? { color: "red" }
    : { color: "" };
  return (
    <button
      /*       disabled={auth || disabled} */
      disabled={disabled}
      onClick={handleClick}
      className={`  
      ${trends ? "trends-buttons" : ""}
      ${active ? "active" : ""}
      ${!noStyles && auth ? "auth" : !noStyles ? "no-auth" : ""}
      ${!noStyles && primary ? "primary" : ""}
      ${!noStyles && tertiary ? "tertiary" : ""}
      ${!noStyles && fullWidth ? "full-width" : ""}
      ${!noStyles && secondary ? "secondary" : !noStyles ? "button" : ""}
      ${!noStyles && large ? "large" : ""}
      ${!noStyles && outline ? "button-outline" : ""}
      ${disabled ? "disabled" : ""} 
      `}
    >
      {icon && (
        <span className="button-icon" style={arrowColorStyle}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
};

export default CustomButton;
