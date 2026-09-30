import { useState } from "react";
import { Link } from "react-router-dom";

function Help() {
  const [openQuestion, setOpenQuestion] =
    useState(null);

  const toggleQuestion = (question) => {
    setOpenQuestion(
      openQuestion === question
        ? null
        : question
    );
  };

  const faqs = [
    {
      id: 1,
      question:
        "How do I save a book to my library?",
      answer:
        "Open any book and select the Add to Library button. The book will then appear in your Library so you can easily find it again.",
    },
    {
      id: 2,
      question:
        "How do I continue listening where I left off?",
      answer:
        "Your listening progress is automatically saved while you listen. Open the book from your Library and select Continue Listening to resume from your previous position.",
    },
    {
      id: 3,
      question:
        "How do I save a highlight?",
      answer:
        "Open a book in the player, enter the passage or idea you want to remember in the Save a Highlight section, and select Save Highlight. Your highlights are stored in your account and can be viewed from the Highlights page.",
    },
    {
      id: 4,
      question:
        "What is included with Premium?",
      answer:
        "Premium gives you access to books that require a subscription. Your current subscription status and billing information can be viewed from Settings.",
    },
    {
      id: 5,
      question:
        "How does the free trial work?",
      answer:
        "If a free trial is available when you subscribe, you can begin using Premium during the trial period. Your subscription information, including the trial end date when available, is shown in Settings.",
    },
    {
      id: 6,
      question:
        "How do I manage or cancel my subscription?",
      answer:
        "Go to Settings and select Manage Subscription. You can manage your subscription and billing information through the subscription management portal.",
    },
    {
      id: 7,
      question:
        "How do I remove a book from my library?",
      answer:
        "Open your Library, find the book you want to remove, select Remove, and confirm the removal.",
    },
    {
      id: 8,
      question:
        "I am having trouble playing a book. What should I do?",
      answer:
        "First, make sure you are logged in and that you have access to the book. If the problem continues, refresh the page and try again. Premium books require an active Premium subscription.",
    },
  ];

  return (
    <main className="help-page">
      <div className="help-page__container">
        <header className="help-page__header">
          <h1>Help & Support</h1>

          <p>
            Find answers to common questions
            about using Summarist.
          </p>
        </header>

        <section className="help-section">
          <h2>Frequently Asked Questions</h2>

          <div className="help-faq">
            {faqs.map((faq) => {
              const isOpen =
                openQuestion === faq.id;

              return (
                <div
                  className={`help-faq__item ${
                    isOpen
                      ? "help-faq__item--open"
                      : ""
                  }`}
                  key={faq.id}
                >
                  <button
                    type="button"
                    className="help-faq__question"
                    onClick={() =>
                      toggleQuestion(
                        faq.id
                      )
                    }
                    aria-expanded={isOpen}
                    aria-controls={`help-answer-${faq.id}`}
                  >
                    <span>
                      {faq.question}
                    </span>

                    <span
                      className="help-faq__icon"
                      aria-hidden="true"
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`help-answer-${faq.id}`}
                      className="help-faq__answer"
                    >
                      <p>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="help-section">
          <div className="help-contact">
            <div className="help-contact__icon">
              ?
            </div>

            <div className="help-contact__content">
              <h2>
                Still need help?
              </h2>

              <p>
                If you couldn't find the answer
                you're looking for, you can
                return to your account or browse
                your books.
              </p>

              <div className="help-contact__actions">
                <Link
                  to="/settings"
                  className="book-page__button"
                >
                  Account Settings
                </Link>

                <Link
                  to="/for-you"
                  className="book-page__button book-page__button--secondary"
                >
                  Browse Books
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Help;