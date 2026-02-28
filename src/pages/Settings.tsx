import Layout from "../components/layout/Layout";
import Footer from "../components/Footer";

const Settings = () => {
  return (
    <Layout>
      <div className="content-wrapper">
        <div role="heading" style={{ fontSize: "1.5rem", fontWeight: 600, padding: "1rem 0" }}>
          Settings
        </div>
        <p style={{ color: "var(--text-secondary, #999)" }}>
          Settings page coming soon.
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Settings;
