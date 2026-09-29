import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { get, ref, remove } from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

function Library() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [savedBooks, setSavedBooks] = useState([]);
  const [finishedBooks, setFinishedBooks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [bookToRemove, setBookToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");

  const cancelButtonRef = useRef(null);
  const modalRef = useRef(null);
  const previousFocusedElementRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const loadLibrary = useCallback(
    async (showLoading = false) => {
      if (!currentUser) {
        setSavedBooks([]);
        setFinishedBooks([]);
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        const libraryRef = ref(
          database,
          `users/${currentUser.uid}/library`,
        );

        const snapshot = await get(libraryRef);

        if (!snapshot.exists()) {
          setSavedBooks([]);
          setFinishedBooks([]);
          return;
        }

        const data = snapshot.val();
        const books = Object.values(data);

        const unfinished = books.filter(
          (book) => !book.finished,
        );

        const finished = books.filter(
          (book) => book.finished,
        );

        unfinished.sort(
          (a, b) =>
            (b.savedAt || 0) -
            (a.savedAt || 0),
        );

        finished.sort(
          (a, b) =>
            (b.savedAt || 0) -
            (a.savedAt || 0),
        );

        setSavedBooks(unfinished);
        setFinishedBooks(finished);
      } catch (error) {
        console.error(
          "Failed to load library:",
          error,
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [currentUser],
  );

  useEffect(() => {
    loadLibrary(true);
  }, [loadLibrary, location.key]);

  useEffect(() => {
    const refreshLibrary = () => {
      if (!currentUser) {
        return;
      }

      loadLibrary(false);
    };

    window.addEventListener(
      "focus",
      refreshLibrary,
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshLibrary,
      );
    };
  }, [currentUser, loadLibrary]);

  const showToast = useCallback(
    (message, type = "success") => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setToastType(type);
      setToast(message);

      toastTimeoutRef.current = setTimeout(() => {
        setToast("");
        toastTimeoutRef.current = null;
      }, 3000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const getProgress = (book) => {
    const progress = Number(book.progress);
    const duration = Number(book.duration);

    if (
      !Number.isFinite(progress) ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (progress / duration) * 100,
      ),
    );
  };

  const formatTime = (seconds) => {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return "0:00";
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(
      totalSeconds / 60,
    );
    const remainingSeconds =
      totalSeconds % 60;

    return `${minutes}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  };

  const continueListeningBooks = useMemo(() => {
    return savedBooks
      .filter((book) => {
        const progress = Number(book.progress);
        const duration = Number(book.duration);

        return (
          Number.isFinite(progress) &&
          Number.isFinite(duration) &&
          duration > 0 &&
          progress > 0 &&
          progress < duration &&
          !book.finished
        );
      })
      .sort(
        (a, b) =>
          (b.lastPlayedAt || 0) -
          (a.lastPlayedAt || 0),
      );
  }, [savedBooks]);

  const allLibraryBooks = useMemo(() => {
    return [
      ...savedBooks,
      ...finishedBooks,
    ];
  }, [savedBooks, finishedBooks]);

  const filteredBooks = useMemo(() => {
    let books = [...allLibraryBooks];

    if (filter === "in-progress") {
      books = books.filter((book) => {
        const progress = Number(book.progress);
        const duration = Number(book.duration);

        return (
          !book.finished &&
          Number.isFinite(progress) &&
          Number.isFinite(duration) &&
          duration > 0 &&
          progress > 0 &&
          progress < duration
        );
      });
    }

    if (filter === "not-started") {
      books = books.filter((book) => {
        const progress = Number(book.progress);

        return (
          !book.finished &&
          (!Number.isFinite(progress) ||
            progress <= 0)
        );
      });
    }

    if (filter === "finished") {
      books = books.filter(
        (book) => book.finished,
      );
    }

    const search = searchTerm
      .trim()
      .toLowerCase();

    if (search) {
      books = books.filter((book) => {
        const title = (
          book.title || ""
        ).toLowerCase();

        const author = (
          book.author || ""
        ).toLowerCase();

        return (
          title.includes(search) ||
          author.includes(search)
        );
      });
    }

    if (sortBy === "newest") {
      books.sort(
        (a, b) =>
          (b.savedAt || 0) -
          (a.savedAt || 0),
      );
    }

    if (sortBy === "recently-listened") {
      books.sort(
        (a, b) =>
          (b.lastPlayedAt || 0) -
          (a.lastPlayedAt || 0),
      );
    }

    if (sortBy === "title") {
      books.sort((a, b) =>
        (a.title || "").localeCompare(
          b.title || "",
        ),
      );
    }

    if (sortBy === "author") {
      books.sort((a, b) =>
        (a.author || "").localeCompare(
          b.author || "",
        ),
      );
    }

    return books;
  }, [
    allLibraryBooks,
    filter,
    searchTerm,
    sortBy,
  ]);

  const handleRemoveBook = (book, event) => {
    if (!currentUser || !book) {
      return;
    }

    previousFocusedElementRef.current =
      event?.currentTarget || null;

    setBookToRemove(book);
  };

  const confirmRemoveBook = async () => {
    if (
      !currentUser ||
      !bookToRemove ||
      isRemoving
    ) {
      return;
    }

    setIsRemoving(true);

    try {
      const bookRef = ref(
        database,
        `users/${currentUser.uid}/library/${bookToRemove.id}`,
      );

      await remove(bookRef);

      setSavedBooks((books) =>
        books.filter(
          (item) =>
            String(item.id) !==
            String(bookToRemove.id),
        ),
      );

      setFinishedBooks((books) =>
        books.filter(
          (item) =>
            String(item.id) !==
            String(bookToRemove.id),
        ),
      );

      showToast(
        `"${bookToRemove.title}" was removed from your library.`,
      );

      setBookToRemove(null);
    } catch (error) {
      console.error(
        "Failed to remove book:",
        error,
      );

      showToast(
        "Failed to remove the book from your library.",
        "error",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemoveBook = () => {
    if (isRemoving) {
      return;
    }

    setBookToRemove(null);
  };

  useEffect(() => {
    if (!bookToRemove) {
      return;
    }

    previousFocusedElementRef.current =
      previousFocusedElementRef.current ||
      document.activeElement;

    const focusTimer = setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [bookToRemove]);

  useEffect(() => {
    if (!bookToRemove) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!isRemoving) {
          event.preventDefault();
          cancelRemoveBook();
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalRef.current;

      if (!modal) {
        return;
      }

      const focusableElements =
        modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

      if (!focusableElements.length) {
        return;
      }

      const firstElement =
        focusableElements[0];

      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [bookToRemove, isRemoving]);

  useEffect(() => {
    if (bookToRemove) {
      return;
    }

    const previousElement =
      previousFocusedElementRef.current;

    if (
      previousElement &&
      typeof previousElement.focus === "function" &&
      document.contains(previousElement)
    ) {
      const focusTimer = setTimeout(() => {
        previousElement.focus();
      }, 0);

      previousFocusedElementRef.current =
        null;

      return () => {
        clearTimeout(focusTimer);
      };
    }
  }, [bookToRemove]);

  if (loading) {
    return (
      <main className="library-page">
        <div className="library__container">
          <div className="skeleton skeleton__selected"></div>

          <div className="skeleton__grid">
            {new Array(6)
              .fill(0)
              .map((_, index) => (
                <div
                  className="skeleton skeleton__book"
                  key={index}
                ></div>
              ))}
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="library-page">
        <div className="library__container">
          <div className="library__empty">
            <h1>Your Library</h1>

            <p>
              Log in to save books and keep
              track of your listening progress.
            </p>

            <button
              type="button"
              className="library__empty-button"
              onClick={() =>
                setShowAuthModal(true)
              }
            >
              Log In
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

  const totalBooks =
    allLibraryBooks.length;

  const inProgressCount =
    savedBooks.filter((book) => {
      const progress = Number(book.progress);
      const duration = Number(book.duration);

      return (
        !book.finished &&
        Number.isFinite(progress) &&
        Number.isFinite(duration) &&
        duration > 0 &&
        progress > 0 &&
        progress < duration
      );
    }).length;

  const notStartedCount =
    savedBooks.filter((book) => {
      const progress = Number(book.progress);

      return (
        !book.finished &&
        (!Number.isFinite(progress) ||
          progress <= 0)
      );
    }).length;

  const finishedCount =
    finishedBooks.length;

  return (
    <main className="library-page">
      <div className="library__container">
        <div className="library__header">
          <div>
            <h1>My Library</h1>

            <p>
              Your saved books and listening
              progress.
            </p>
          </div>

          <div className="library__counts">
            <span>
              {totalBooks}{" "}
              {totalBooks === 1
                ? "Book"
                : "Books"}
            </span>
          </div>
        </div>

        {continueListeningBooks.length > 0 && (
          <section className="library-section">
            <div className="library-section__header">
              <div>
                <h2>Continue Listening</h2>

                <p>
                  Pick up where you left off.
                </p>
              </div>
            </div>

            <div className="book-grid">
              {continueListeningBooks.map(
                (book) => {
                  const progress =
                    getProgress(book);

                  return (
                    <div
                      className="library-book-card"
                      key={book.id}
                    >
                      <Link
                        to={`/book/${book.id}`}
                      >
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

                      <div className="library-book-card__progress">
                        <div className="library-book-card__progress-header">
                          <span>
                            {formatTime(
                              book.progress,
                            )}{" "}
                            /{" "}
                            {formatTime(
                              book.duration,
                            )}
                          </span>

                          <span>
                            {Math.round(
                              progress,
                            )}
                            %
                          </span>
                        </div>

                        <div className="library-book-card__progress-track">
                          <div
                            className="library-book-card__progress-bar"
                            style={{
                              width: `${progress}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <Link
                        to={`/player/${book.id}`}
                        className="library-book-card__continue"
                      >
                        Continue listening
                      </Link>

                      <button
                        type="button"
                        className="library-book-card__remove"
                        onClick={(event) =>
                          handleRemoveBook(
                            book,
                            event,
                          )
                        }
                        aria-label={`Remove ${book.title} from your library`}
                      >
                        Remove
                      </button>
                    </div>
                  );
                },
              )}
            </div>
          </section>
        )}

        <section className="library-section">
          <div className="library-section__header">
            <div>
              <h2>Library</h2>

              <p>
                Manage your saved books.
              </p>
            </div>
          </div>

          <div className="library__controls">
            <div className="library__search">
              <input
                type="search"
                placeholder="Search your library..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                aria-label="Search your library"
              />
            </div>

            <div className="library__sort">
              <label htmlFor="library-sort">
                Sort
              </label>

              <select
                id="library-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
              >
                <option value="newest">
                  Newest Added
                </option>

                <option value="recently-listened">
                  Recently Listened
                </option>

                <option value="title">
                  Title A–Z
                </option>

                <option value="author">
                  Author A–Z
                </option>
              </select>
            </div>
          </div>

          <div className="library__filters">
            <button
              type="button"
              className={
                filter === "all"
                  ? "library__filter library__filter--active"
                  : "library__filter"
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All ({totalBooks})
            </button>

            <button
              type="button"
              className={
                filter === "in-progress"
                  ? "library__filter library__filter--active"
                  : "library__filter"
              }
              onClick={() =>
                setFilter("in-progress")
              }
            >
              In Progress ({inProgressCount})
            </button>

            <button
              type="button"
              className={
                filter === "not-started"
                  ? "library__filter library__filter--active"
                  : "library__filter"
              }
              onClick={() =>
                setFilter("not-started")
              }
            >
              Not Started ({notStartedCount})
            </button>

            <button
              type="button"
              className={
                filter === "finished"
                  ? "library__filter library__filter--active"
                  : "library__filter"
              }
              onClick={() =>
                setFilter("finished")
              }
            >
              Finished ({finishedCount})
            </button>
          </div>

          {filteredBooks.length > 0 ? (
            <div className="book-grid">
              {filteredBooks.map((book) => {
                const progress =
                  getProgress(book);

                return (
                  <div
                    className="library-book-card"
                    key={book.id}
                  >
                    <Link
                      to={`/book/${book.id}`}
                    >
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

                    {book.finished ? (
                      <span className="library-book-card__finished">
                        ✓ Finished
                      </span>
                    ) : progress > 0 ? (
                      <div className="library-book-card__progress">
                        <div className="library-book-card__progress-header">
                          <span>
                            {formatTime(
                              book.progress,
                            )}{" "}
                            /{" "}
                            {formatTime(
                              book.duration,
                            )}
                          </span>

                          <span>
                            {Math.round(
                              progress,
                            )}
                            %
                          </span>
                        </div>

                        <div className="library-book-card__progress-track">
                          <div
                            className="library-book-card__progress-bar"
                            style={{
                              width: `${progress}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <span className="library-book-card__continue">
                        Not started
                      </span>
                    )}

                    {!book.finished &&
                      progress > 0 && (
                        <Link
                          to={`/player/${book.id}`}
                          className="library-book-card__continue"
                        >
                          Continue listening
                        </Link>
                      )}

                    <button
                      type="button"
                      className="library-book-card__remove"
                      onClick={(event) =>
                        handleRemoveBook(
                          book,
                          event,
                        )
                      }
                      aria-label={`Remove ${book.title} from your library`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="library__empty">
              <h2>
                {searchTerm
                  ? "No Books Found"
                  : filter === "all"
                  ? "Your Library Is Empty"
                  : "No Books in This Filter"}
              </h2>

              <p>
                {searchTerm
                  ? "Try a different title or author."
                  : filter === "all"
                  ? "Start exploring books and add them to your library."
                  : "Try selecting another filter to see your saved books."}
              </p>

              {searchTerm ? (
                <button
                  type="button"
                  className="library__empty-button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  className="library__empty-button"
                  onClick={() =>
                    navigate("/for-you")
                  }
                >
                  Browse Books
                </button>
              )}
            </div>
          )}
        </section>

        {finishedBooks.length > 0 &&
          filter === "all" &&
          !searchTerm && (
            <section className="library-section">
              <div className="library-section__header">
                <div>
                  <h2>Finished Books</h2>

                  <p>
                    Books you've completed.
                  </p>
                </div>
              </div>

              <div className="book-grid">
                {finishedBooks.map((book) => (
                  <div
                    className="library-book-card"
                    key={`finished-${book.id}`}
                  >
                    <Link
                      to={`/book/${book.id}`}
                    >
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

                    <span className="library-book-card__finished">
                      ✓ Finished
                    </span>

                    <button
                      type="button"
                      className="library-book-card__remove"
                      onClick={(event) =>
                        handleRemoveBook(
                          book,
                          event,
                        )
                      }
                      aria-label={`Remove ${book.title} from your library`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>

      {bookToRemove && (
        <div
          className="library-modal"
          role="presentation"
        >
          <div
            ref={modalRef}
            className="library-modal__content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-book-title"
            aria-describedby="remove-book-description"
          >
            <button
              type="button"
              className="library-modal__close"
              onClick={cancelRemoveBook}
              disabled={isRemoving}
              aria-label="Close removal confirmation"
            >
              ×
            </button>

            <h2 id="remove-book-title">
              Remove Book?
            </h2>

            <p id="remove-book-description">
              Are you sure you want to remove{" "}
              <strong>
                "{bookToRemove.title}"
              </strong>{" "}
              from your library? Your listening
              progress will also no longer be
              associated with this saved book.
            </p>

            <div className="library-modal__actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="library-modal__cancel"
                onClick={cancelRemoveBook}
                disabled={isRemoving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="library-modal__confirm"
                onClick={confirmRemoveBook}
                disabled={isRemoving}
              >
                {isRemoving
                  ? "Removing..."
                  : "Remove Book"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`library-toast library-toast--${toastType}`}
          role="status"
          aria-live="polite"
        >
          <span className="library-toast__icon">
            {toastType === "error"
              ? "!"
              : "✓"}
          </span>

          <span>{toast}</span>

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