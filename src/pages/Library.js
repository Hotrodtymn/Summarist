import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  get,
  ref,
  remove,
} from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

function Library() {
  const {
    currentUser,
    isAuthenticated,
  } = useAuth();

  const [savedBooks, setSavedBooks] =
    useState([]);

  const [finishedBooks, setFinishedBooks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const [bookToRemove, setBookToRemove] =
    useState(null);

  const [isRemoving, setIsRemoving] =
    useState(false);

  const [toast, setToast] =
    useState("");

  const fetchLibrary =
    useCallback(async () => {
      if (
        !currentUser ||
        !isAuthenticated
      ) {
        setSavedBooks([]);
        setFinishedBooks([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const libraryRef = ref(
          database,
          `users/${currentUser.uid}/library`
        );

        const snapshot =
          await get(libraryRef);

        if (!snapshot.exists()) {
          setSavedBooks([]);
          setFinishedBooks([]);
          return;
        }

        const libraryData =
          snapshot.val();

        const books =
          Object.values(libraryData);

        const sortedBooks =
          books.sort(
            (a, b) =>
              (b.savedAt || 0) -
              (a.savedAt || 0)
          );

        setSavedBooks(
          sortedBooks.filter(
            (book) => !book.finished
          )
        );

        setFinishedBooks(
          sortedBooks.filter(
            (book) => book.finished
          )
        );
      } catch (error) {
        console.error(
          "Failed to fetch library:",
          error
        );

        setSavedBooks([]);
        setFinishedBooks([]);
      } finally {
        setLoading(false);
      }
    }, [
      currentUser,
      isAuthenticated,
    ]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchLibrary();
    };

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [fetchLibrary]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => {
      setToast("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toast]);

  const handleRemoveClick = (book) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setBookToRemove(book);
  };

  const cancelRemoveBook = () => {
    if (isRemoving) {
      return;
    }

    setBookToRemove(null);
  };

  const confirmRemoveBook = async () => {
    if (
      !currentUser ||
      !isAuthenticated ||
      !bookToRemove ||
      isRemoving
    ) {
      return;
    }

    setIsRemoving(true);

    try {
      const bookId = String(
        bookToRemove.id
      );

      const bookRef = ref(
        database,
        `users/${currentUser.uid}/library/${bookId}`
      );

      await remove(bookRef);

      setSavedBooks((books) =>
        books.filter(
          (book) =>
            String(book.id) !==
            bookId
        )
      );

      setFinishedBooks((books) =>
        books.filter(
          (book) =>
            String(book.id) !==
            bookId
        )
      );

      setToast(
        `"${bookToRemove.title}" was removed from your library.`
      );

      setBookToRemove(null);
    } catch (error) {
      console.error(
        "Failed to remove book:",
        error
      );

      setToast(
        "Unable to remove the book. Please try again."
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const renderBookCard = (
    book,
    isFinished = false
  ) => {
    return (
      <div
        className="book-card library-book-card"
        key={book.id}
      >
        <Link to={`/book/${book.id}`}>
          <div className="book-card__image-wrapper">
            {book.subscriptionRequired && (
              <span className="book-card__premium">
                Premium
              </span>
            )}

            <img
              src={book.imageLink}
              alt={book.title}
              className="book-card__image"
            />
          </div>

          <h3>{book.title}</h3>

          <p>{book.author}</p>
        </Link>

        {isFinished && (
          <div
            className="library-book-card__finished"
            role="status"
          >
            ✓ Finished
          </div>
        )}

        <button
          type="button"
          className="library-book-card__remove"
          onClick={() =>
            handleRemoveClick(book)
          }
          aria-label={`Remove ${book.title} from your library`}
        >
          Remove
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="library-page">
        <div className="library-page__container">
          <div className="library-page__header">
            <div
              className="skeleton"
              style={{
                width: "220px",
                height: "40px",
                marginBottom: "12px",
              }}
            />

            <div
              className="skeleton"
              style={{
                width: "420px",
                maxWidth: "100%",
                height: "20px",
              }}
            />
          </div>

          <section className="library-section">
            <div
              className="skeleton"
              style={{
                width: "150px",
                height: "28px",
                marginBottom: "22px",
              }}
            />

            <div className="book-grid">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div key={item}>
                    <div
                      className="skeleton"
                      style={{
                        width: "100%",
                        aspectRatio:
                          "2 / 3",
                        marginBottom:
                          "12px",
                      }}
                    />

                    <div
                      className="skeleton"
                      style={{
                        width: "80%",
                        height: "16px",
                        marginBottom:
                          "8px",
                      }}
                    />

                    <div
                      className="skeleton"
                      style={{
                        width: "55%",
                        height: "14px",
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (
    !currentUser ||
    !isAuthenticated
  ) {
    return (
      <main className="library-page">
        <div className="library-page__container">
          <div className="library-page__header">
            <h1>My Library</h1>

            <p>
              Log in to save books and
              keep track of your reading.
            </p>
          </div>

          <div className="library-empty">
            <div className="library-empty__icon">
              ▣
            </div>

            <h3>
              Log in to view your library
            </h3>

            <p>
              Your saved and finished
              books will appear here.
            </p>

            <button
              type="button"
              className="book-page__button"
              onClick={() =>
                setShowAuthModal(true)
              }
              style={{
                marginTop: "20px",
              }}
            >
              Log in
            </button>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() =>
              setShowAuthModal(false)
            }
          />
        )}
      </main>
    );
  }

  return (
    <main className="library-page">
      <div className="library-page__container">
        <div className="library-page__header">
          <h1>My Library</h1>

          <p>
            Your saved books and finished
            books.
          </p>
        </div>

        {toast && (
          <div
            className="library-toast"
            role="status"
            aria-live="polite"
          >
            {toast}
          </div>
        )}

        <section className="library-section">
          <div className="library-section__header">
            <h2>Saved Books</h2>
          </div>

          {savedBooks.length > 0 ? (
            <div className="book-grid">
              {savedBooks.map((book) =>
                renderBookCard(book)
              )}
            </div>
          ) : (
            <div className="library-empty">
              <div className="library-empty__icon">
                ▣
              </div>

              <h3>
                Your library is empty
              </h3>

              <p>
                Add books from the book
                page and they'll appear
                here.
              </p>
            </div>
          )}
        </section>

        <section className="library-section">
          <div className="library-section__header">
            <h2>Finished Books</h2>
          </div>

          {finishedBooks.length > 0 ? (
            <div className="book-grid">
              {finishedBooks.map(
                (book) =>
                  renderBookCard(
                    book,
                    true
                  )
              )}
            </div>
          ) : (
            <div className="library-empty">
              <div className="library-empty__icon">
                ✓
              </div>

              <h3>
                No finished books yet
              </h3>

              <p>
                Books you finish listening
                to will appear here.
              </p>
            </div>
          )}
        </section>
      </div>

      {bookToRemove && (
        <div
          className="library-modal__overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelRemoveBook();
            }
          }}
        >
          <div
            className="library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-book-title"
            aria-describedby="remove-book-description"
          >
            <h2 id="remove-book-title">
              Remove book?
            </h2>

            <p id="remove-book-description">
              Are you sure you want to
              remove{" "}
              <strong>
                {bookToRemove.title}
              </strong>{" "}
              from your library?
            </p>

            <div className="library-modal__actions">
              <button
                type="button"
                className="library-modal__cancel"
                onClick={
                  cancelRemoveBook
                }
                disabled={isRemoving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="library-modal__confirm"
                onClick={
                  confirmRemoveBook
                }
                disabled={isRemoving}
              >
                {isRemoving
                  ? "Removing..."
                  : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() =>
            setShowAuthModal(false)
          }
        />
      )}
    </main>
  );
}

export default Library;