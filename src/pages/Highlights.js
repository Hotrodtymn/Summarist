import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { get, ref, remove } from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

function Highlights() {
  const { currentUser } = useAuth();
  const location = useLocation();

  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] =
    useState(false);
  const [removingId, setRemovingId] =
    useState(null);

  const fetchHighlights = useCallback(async () => {
    if (!currentUser) {
      setHighlights([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const highlightsRef = ref(
        database,
        `users/${currentUser.uid}/highlights`
      );

      const snapshot = await get(
        highlightsRef
      );

      if (!snapshot.exists()) {
        setHighlights([]);
        return;
      }

      const data = snapshot.val();

      const highlightList = Object.entries(
        data
      ).map(([id, highlight]) => ({
        id,
        ...highlight,
      }));

      highlightList.sort(
        (a, b) =>
          (b.createdAt || 0) -
          (a.createdAt || 0)
      );

      setHighlights(highlightList);
    } catch (error) {
      console.error(
        "Failed to load highlights:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHighlights();
  }, [location.key, fetchHighlights]);

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchHighlights();
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
  }, [fetchHighlights]);

  const handleRemoveHighlight = async (
    highlightId
  ) => {
    if (!currentUser || !highlightId) {
      return;
    }

    setRemovingId(highlightId);

    try {
      const highlightRef = ref(
        database,
        `users/${currentUser.uid}/highlights/${highlightId}`
      );

      await remove(highlightRef);

      setHighlights((currentHighlights) =>
        currentHighlights.filter(
          (highlight) =>
            highlight.id !== highlightId
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove highlight:",
        error
      );
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <main className="highlights-page">
        <div className="highlights-page__container">
          <div className="highlights-page__header">
            <div
              className="skeleton"
              style={{
                width: "180px",
                height: "40px",
                marginBottom: "12px",
              }}
            />

            <div
              className="skeleton"
              style={{
                width: "400px",
                maxWidth: "100%",
                height: "20px",
              }}
            />
          </div>

          <div className="highlights-list">
            {[1, 2, 3].map((item) => (
              <div
                className="highlight-card"
                key={item}
              >
                <div
                  className="skeleton"
                  style={{
                    width: "100%",
                    height: "80px",
                    marginBottom: "16px",
                  }}
                />

                <div
                  className="skeleton"
                  style={{
                    width: "45%",
                    height: "16px",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="highlights-page">
        <div className="highlights-page__container">
          <header className="highlights-page__header">
            <h1>Highlights</h1>

            <p>
              Save important moments from the
              books you listen to.
            </p>
          </header>

          <div className="highlights-empty">
            <div className="highlights-empty__icon">
              ★
            </div>

            <h2>
              Log in to view your highlights
            </h2>

            <p>
              Your saved highlights will be
              available here whenever you log
              in.
            </p>

            <button
              type="button"
              className="book-page__button"
              onClick={() =>
                setShowAuthModal(true)
              }
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
    <main className="highlights-page">
      <div className="highlights-page__container">
        <header className="highlights-page__header">
          <h1>Highlights</h1>

          <p>
            Your saved moments from the books
            you've listened to.
          </p>
        </header>

        {highlights.length > 0 ? (
          <div className="highlights-list">
            {highlights.map((highlight) => (
              <article
                className="highlight-card"
                key={highlight.id}
              >
                <div className="highlight-card__quote">
                  “
                </div>

                <p className="highlight-card__text">
                  {highlight.text}
                </p>

                <div className="highlight-card__footer">
                  <div>
                    <strong>
                      {highlight.bookTitle ||
                        "Unknown book"}
                    </strong>

                    {highlight.author && (
                      <span>
                        {highlight.author}
                      </span>
                    )}

                    {highlight.createdAt && (
                      <small>
                        Saved{" "}
                        {formatDate(
                          highlight.createdAt
                        )}
                      </small>
                    )}
                  </div>

                  <div className="highlight-card__actions">
                    {highlight.bookId && (
                      <Link
                        to={`/book/${highlight.bookId}`}
                        className="highlight-card__book"
                      >
                        View book
                      </Link>
                    )}

                    <button
                      type="button"
                      className="highlight-card__remove"
                      onClick={() =>
                        handleRemoveHighlight(
                          highlight.id
                        )
                      }
                      disabled={
                        removingId ===
                        highlight.id
                      }
                    >
                      {removingId ===
                      highlight.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="highlights-empty">
            <div className="highlights-empty__icon">
              ★
            </div>

            <h2>
              No highlights yet
            </h2>

            <p>
              When you save a highlight from a
              book, it will appear here.
            </p>

            <Link
              to="/for-you"
              className="book-page__button"
            >
              Browse books
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default Highlights;