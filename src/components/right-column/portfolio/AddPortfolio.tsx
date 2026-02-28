import  { useState } from "react";
import CustomButton from "../../CustomButton";
import { FaChartBar } from "react-icons/fa";
import "./Portfolio.css";
import { useNavigate } from "react-router-dom";
import { portfolioStorage } from "../../../services/storage";
import NewPortfolioModal from "../../modals/AddPortfolioModal";
import { usePortfolios } from "../../../context/PortfoliosContext";
import { useNotification } from "../../../context/NotificationContext";

const AddPortfolio = () => {
  const {  appendPortfolio } = usePortfolios();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleSavePortfolio = (portfolioName: string) => {
    const response = portfolioStorage.create({
      title: portfolioName,
    });
    appendPortfolio(response);
    addNotification(`${response.title} added!`, "success");
    closeModal();
    navigate(`/portfolio/${response.id}`);
  };
  return (
    <div className="add-portfolio-container">
      <div className="add-portfolio-header">
        <div className="add-portfolio-icon">
          <FaChartBar size={30} />
        </div>
        <div className="add-portfolio-text">
          Create a portfolio to view your investments in one place
        </div>
      </div>
      <div className="add-portfolio-button">
        <CustomButton
          label="New Portfolio"
          onClick={openModal}
          fullWidth
          large
        />
      </div>
      {isModalOpen && (
        <NewPortfolioModal onCancel={closeModal} onSave={handleSavePortfolio} />
      )}
    </div>
  );
};

export default AddPortfolio;
