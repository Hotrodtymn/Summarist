import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get, ref, remove, set } from "firebase/database";

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

  const [isSaved, setIsSaved] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

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

  useEffect(() => {
    const checkLibrary = async () => {
      if (!currentUser || !id) {
        setIsSaved(false);
        return;
      }

      try {
        const libraryRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}`,
        );

        const snapshot = await get(libraryRef);

        setIsSaved(snapshot.exists());
      } catch (error) {
        console.error("Failed to check library:", error);
      }
    };

    checkLibrary();
  }, [currentUser, id]);

  const showToast = (message, type = "success") => {
    setToastType(type);
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const handleProtectedAction = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!book) {
      return;
    }

    if (!book.subscriptionRequired) {
      navigate(`/player/${book.id}`);
      return;
    }

    const premium = await isPremiumUser(currentUser.uid);

    if (premium) {
      navigate(`/player/${book.id}`);
      return;
    }

    navigate("/choose-plan");
  };

  const handleAddToLibrary = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!book || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const libraryRef = ref(
        database,
        `users/${currentUser.uid}/library/${book.id}`,
      );

      await set(libraryRef, {
        id: book.id,
        title: book.title || "",
        author: book.author || "",
        subTitle: book.subTitle || "",
        description: book.description || "",
        imageLink: book.imageLink || "",
        subscriptionRequired: book.subscriptionRequired || false,
        finished: false,
        savedAt: Date.now(),
      });

      setIsSaved(true);

      showToast(`"${book.title}" was added to your library.`);
    } catch (error) {
      console.error("Failed to add book to library:", error);

      showToast("Failed to add the book to your library.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!currentUser || !book || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const libraryRef = ref(
        database,
        `users/${currentUser.uid}/library/${book.id}`,
      );

      await remove(libraryRef);

      setIsSaved(false);

      showToast(`"${book.title}" was removed from your library.`);
    } catch (error) {
      console.error("Failed to remove book from library:", error);

      showToast("Failed to remove the book from your library.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <div className="skeleton skeleton__selected"></div>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="book-page">
        <div className="book-page__container">
          <div className="library__empty">
            <h1>Book Not Found</h1>

            <p>We couldn't find the book you're looking for.</p>

            <button
              type="button"
              className="book-page__button"
              onClick={() => navigate("/for-you")}
            >
              Back to Books
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="book-page">
      <div className="book-page__container">
        <div className="book-page__image-wrapper">
          {book.subscriptionRequired && (
            <span className="book-card__premium">Premium</span>
          )}

          <img
            src={book.imageLink}
            alt={book.title}
            className="book-page__image"
          />
        </div>

        <div className="book-page__content">
          <h1>{book.title}</h1>

          <h2>{book.author}</h2>

          <p className="book-page__subtitle">{book.subTitle}</p>

          <p className="book-page__description">{book.description}</p>

          <div className="book-page__actions">
            <button
              type="button"
              className="book-page__button"
              onClick={handleProtectedAction}
            >
              {book.subscriptionRequired ? "Listen with Premium" : "Listen"}
            </button>

            {isSaved ? (
              <button
                type="button"
                className="book-page__button book-page__button--secondary"
                onClick={handleRemoveFromLibrary}
                disabled={isSaving}
              >
                {isSaving ? "Removing..." : "Remove from Library"}
              </button>
            ) : (
              <button
                type="button"
                className="book-page__button book-page__button--secondary"
                onClick={handleAddToLibrary}
                disabled={isSaving}
              >
                {isSaving ? "Adding..." : "Add to Library"}
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`library-toast library-toast--${toastType}`}
          role="status"
          aria-live="polite"
        >
          <span className="library-toast__icon">
            {toastType === "error" ? "!" : "✓"}
          </span>

          <span>{toast}</span>

          {toastType === "success" && (
            <button
              type="button"
              className="library-toast__link"
              onClick={() => navigate("/library")}
            >
              View Library
            </button>
          )}

          <button
            type="button"
            className="library-toast__close"
            onClick={() => setToast("")}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </main>
  );
}

export default Book;
