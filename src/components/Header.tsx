interface HeaderProps {
  showBackArrow?: boolean;
  label: string;
}

const Header: React.FC<HeaderProps> = ({ label }) => {
  return (
    <div>
      <h1>{label}</h1>
    </div>
  );
};

export default Header;
