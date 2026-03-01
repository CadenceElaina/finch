import Layout from "../../components/layout/Layout";
import Footer from "../../components/Footer";
import "./FooterPage.css";

const Privacy = () => {
  return (
    <Layout>
      <div className="footer-page">
        <h1>Privacy</h1>
        <p className="page-subtitle">Last updated: February 2026</p>

        <h2>What We Collect</h2>
        <p>
          Finch does not collect, store, or transmit any personal data to
          external servers. All user data — including portfolios, watchlists, and
          preferences — is stored exclusively in your browser's localStorage.
        </p>

        <h2>Third-Party APIs</h2>
        <p>
          Finch fetches market data from Yahoo Finance and Seeking Alpha via
          RapidAPI, and uses Google Gemini for AI features. These requests are
          made from your browser and are subject to the respective providers'
          privacy policies:
        </p>
        <ul>
          <li>
            <a href="https://rapidapi.com/privacy" target="_blank" rel="noopener noreferrer">
              RapidAPI Privacy Policy
            </a>
          </li>
          <li>
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google Privacy Policy
            </a>
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          Finch does not use cookies. All persistence is handled through
          browser localStorage.
        </p>

        <h2>Analytics</h2>
        <p>
          Finch does not include any analytics, tracking pixels, or
          third-party scripts for user behavior monitoring.
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Privacy;
