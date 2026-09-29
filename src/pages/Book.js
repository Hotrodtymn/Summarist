import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  get,
  ref,
  set,
} from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import { isPremiumUser } from "../utils/subscription";

function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

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

  useEffect(() => {
    const checkLibrary = async () => {
      if (!currentUser || !id) {
        setIsSaved(false);
        return;
      }

      try {
        const libraryRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}`
        );

        const snapshot = await get(libraryRef);

        setIsSaved(snapshot.exists());
      } catch (error) {
        console.error("Failed to check library:", error);
      }
    };

    checkLibrary();
  }, [currentUser, id]);

  const handleProtectedAction = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!book) {
      return;
    }

    if (!book.subscriptionRequired) {
      navigate(`/player/${id}`);
      return;
    }

    setCheckingSubscription(true);

    try {
      const premium = await isPremiumUser(currentUser.uid);

      if (premium) {
        navigate(`/player/${id}`);
      } else {
        navigate("/choose-plan");
      }
    } catch (error) {
      console.error(
        "Failed to check subscription:",
        error
      );

      navigate("/choose-plan");
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!book || isSaving || isSaved) {
      return;
    }

    setIsSaving(true);

    try {
      const libraryRef = ref(
        database,
        `users/${currentUser.uid}/library/${book.id}`
      );

      await set(libraryRef, {
        id: book.id,
        title: book.title || "",
        author: book.author || "",
        subTitle: book.subTitle || "",
        description: book.description || "",
        imageLink: book.imageLink || "",
        subscriptionRequired:
          book.subscriptionRequired || false,
        finished: false,
        savedAt: Date.now(),
      });

      setIsSaved(true);
    } catch (error) {
      console.error(
        "Failed to add book to library:",
        error
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <div className="book-page__content">
            <div
              className="skeleton"
              style={{
                width: "260px",
                height: "390px",
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{
                  width: "70%",
                  height: "40px",
                  marginBottom: "20px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  width: "40%",
                  height: "20px",
                  marginBottom: "25px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  width: "100%",
                  height: "120px",
                }}
              />
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

        <div className="book-page__content">
          <img
            src={book.imageLink}
            alt={book.title}
            className="book-page__image"
          />

          <div className="book-page__info">
            {book.subscriptionRequired && (
              <div className="book-page__premium-badge">
                🔒 Premium
              </div>
            )}

            <h1>{book.title}</h1>

            <p className="book-page__author">
              {book.author}
            </p>

            <p className="book-page__subtitle">
              {book.subTitle}
            </p>

            <p className="book-page__description">
              {book.description}
            </p>

            <div className="book-page__actions">
              <button
                type="button"
                className="book-page__button"
                onClick={handleProtectedAction}
                disabled={checkingSubscription}
              >
                {checkingSubscription
                  ? "Checking..."
                  : book.subscriptionRequired
                    ? "Listen with Premium"
                    : "Listen"}
              </button>

              <button
                type="button"
                className="book-page__button book-page__button--secondary"
                onClick={handleAddToLibrary}
                disabled={isSaving || isSaved}
              >
                {isSaving
                  ? "Adding..."
                  : isSaved
                    ? "Added to Library"
                    : "Add to Library"}
              </button>
            </div>
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