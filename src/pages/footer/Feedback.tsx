import { useState } from "react";
import Layout from "../../components/layout/Layout";
import Footer from "../../components/Footer";
import "./FooterPage.css";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app this would send to a backend.
    // For the portfolio project, we just show a confirmation.
    setSubmitted(true);
    setMessage("");
  };

  return (
    <Layout>
      <div className="footer-page">
        <h1>Send Feedback</h1>
        <p className="page-subtitle">
          Help improve Finch — your feedback is appreciated
        </p>

        {submitted ? (
          <div className="feedback-success">
            Thanks for your feedback! Since Finch is a portfolio project, feedback
            is noted but not routed to a support team.
          </div>
        ) : (
          <>
            <p>
              Finch is a portfolio project and is actively being developed. If you
              notice a bug, have a feature suggestion, or just want to share your
              thoughts, feel free to leave a message below.
            </p>
            <form className="feedback-form" onSubmit={handleSubmit}>
              <textarea
                placeholder="Describe a bug, suggest an improvement, or share your thoughts..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                className="feedback-submit"
                disabled={message.trim().length === 0}
              >
                Submit Feedback
              </button>
            </form>
          </>
        )}

        <h2>Other Ways to Reach Out</h2>
        <p>
          You can also open an issue or pull request on the{" "}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub repository
          </a>
          .
        </p>
      </div>
      <Footer />
    </Layout>
  );
};

export default Feedback;
