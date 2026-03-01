import Layout from "../../components/layout/Layout";
import Footer from "../../components/Footer";
import "./FooterPage.css";

const Terms = () => {
  return (
    <Layout>
      <div className="footer-page">
        <h1>Terms of Use</h1>
        <p className="page-subtitle">Last updated: February 2026</p>

        <h2>Acceptance</h2>
        <p>
          By accessing and using Finch, you agree to these terms. Finch is a
          portfolio/demonstration project and is provided for educational
          purposes only.
        </p>

        <h2>Use of the Application</h2>
        <p>You agree to use Finch only for lawful purposes. You may:</p>
        <ul>
          <li>View market data and AI-generated analysis</li>
          <li>Create and manage personal watchlists and portfolios</li>
          <li>Use the AI research features within the daily credit limit</li>
        </ul>

        <h2>Intellectual Property</h2>
        <p>
          Market data is sourced from third-party APIs and is the property of
          the respective data providers. AI-generated content is produced by
          Google Gemini and is subject to Google's terms of service.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Finch is provided "as is" without warranties of any kind. The
          developer is not liable for any direct, indirect, or consequential
          damages arising from the use of this application, including but not
          limited to financial losses based on information displayed.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          These terms may be updated at any time. Continued use of the
          application constitutes acceptance of any modifications.
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Terms;
