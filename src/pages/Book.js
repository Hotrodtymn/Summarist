import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";

function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${id}`
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

  const handleProtectedAction = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    navigate(`/player/${id}`);
  };

  const handleAddToLibrary = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    console.log("Add book to library:", book);
  };

  if (loading) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <div className="book-details">
            <div className="book-details__image skeleton"></div>

            <div className="book-details__content">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-button"></div>
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
          <p>Book not found.</p>

          <Link to="/for-you">
            ← Back to For You
          </Link>
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
            <img
              src={book.imageLink}
              alt={book.title}
            />
          </div>

          <div className="book-details__content">
            <h1>{book.title}</h1>

            <p className="book-details__author">
              {book.author}
            </p>

            <p className="book-details__subtitle">
              {book.subTitle}
            </p>

            <div className="book-details__buttons">
              <button onClick={handleProtectedAction}>
                Read
              </button>

              <button onClick={handleProtectedAction}>
                Listen
              </button>
            </div>

            <button onClick={handleAddToLibrary}>
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