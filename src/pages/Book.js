import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AuthModal from "../components/AuthModal";

function Book() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
const handleProtectedAction = () => {
  if (!isLoggedIn) {
    setShowAuthModal(true);
    return;
  }

  console.log("User is logged in");
};

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${id}`,
        );

        const data = await response.json();

        setBook(data);
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <div className="book-page__skeleton">
            <div className="skeleton book-page__skeleton-image"></div>

            <div className="book-page__skeleton-content">
              <div className="skeleton book-page__skeleton-title"></div>
              <div className="skeleton book-page__skeleton-text"></div>
              <div className="skeleton book-page__skeleton-text"></div>
              <div className="skeleton book-page__skeleton-button"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <h1>Book not found</h1>
          <Link to="/for-you">Back to For You</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="book-page">
      <div className="book-page__container">
        <Link to="/for-you" className="book-page__back">
          ← Back to For You
        </Link>

        <div className="book-details">
          <div className="book-details__image">
            <img src={book.imageLink} alt={book.title} />
          </div>

          <div className="book-details__content">
            <h1>{book.title}</h1>

            <p className="book-details__author">{book.author}</p>

            <p className="book-details__subtitle">{book.subTitle}</p>

            <div className="book-details__buttons">
  <button
    className="book-details__button"
    onClick={handleProtectedAction}
  >
    Read
  </button>

  <button
    className="book-details__button"
    onClick={handleProtectedAction}
  >
    Listen
  </button>
</div>

<button
  className="book-details__library"
  onClick={handleProtectedAction}
>
  + Add title to My Library
</button>
          </div>
        </div>
      </div>
      {showAuthModal && (
  <AuthModal
    onClose={() => setShowAuthModal(false)}
  />
)}
    </main>
  );
}

export default Book;
