import Layout from "../../components/layout/Layout";
import Footer from "../../components/Footer";
import "./FooterPage.css";

const Disclaimer = () => {
  return (
    <Layout>
      <div className="footer-page">
        <h1>Disclaimer</h1>
        <p className="page-subtitle">Last updated: February 2026</p>

        <h2>Not Financial Advice</h2>
        <p>
          Finch is a portfolio project built for educational and demonstration
          purposes. Nothing on this site constitutes financial advice,
          investment recommendations, or an offer to buy or sell any securities.
        </p>

        <h2>Data Accuracy</h2>
        <p>
          Market data displayed on Finch is sourced from third-party APIs
          (Yahoo Finance and Seeking Alpha via RapidAPI). While we strive for
          accuracy, data may be delayed, incomplete, or occasionally
          inaccurate. Always verify information with official sources before
          making any financial decisions.
        </p>

        <h2>AI-Generated Content</h2>
        <p>
          The AI Research features are powered by Google Gemini and generate
          automated analysis. AI-generated content may contain inaccuracies,
          outdated information, or errors. It should not be relied upon as the
          sole basis for any financial decision.
        </p>

        <h2>Demo Mode</h2>
        <p>
          When Finch is operating in demo mode, all data shown is static and
          may not reflect current market conditions. Demo data is provided
          solely to illustrate the application's features.
        </p>

        <h2>No Warranty</h2>
        <p>
          This application is provided "as is" without warranty of any kind,
          express or implied. The developer assumes no liability for any losses
          or damages arising from the use of this application.
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Disclaimer;
