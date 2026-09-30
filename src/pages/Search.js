
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SEARCH_API =
  "https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle";

function Search() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmedSearch = searchTerm.trim();

    if (!trimmedSearch) {
      setBooks([]);
      setLoading(false);
      setError("");
      return;
    }

    let isCancelled = false;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${SEARCH_API}?search=${encodeURIComponent(
            trimmedSearch
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to search for books."
          );
        }

        const data = await response.json();

        if (isCancelled) {
          return;
        }

        if (Array.isArray(data)) {
          setBooks(data);
        } else if (data) {
          setBooks([data]);
        } else {
          setBooks([]);
        }
      } catch (fetchError) {
        console.error(
          "Failed to search for books:",
          fetchError
        );

        if (!isCancelled) {
          setBooks([]);
          setError(
            "Unable to search for books. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, retryKey]);

  const handleClearSearch = () => {
    setSearchTerm("");
    setRetryKey(0);
  };

  const handleRetry = () => {
    setRetryKey((current) => current + 1);
  };

  const hasSearchTerm =
    searchTerm.trim().length > 0;

  return (
    <main className="search-page">
      <div className="search-page__container">
        <header className="search-page__header">
          <h1>Search</h1>
          <p>
            Find your next great book.
          </p>
        </header>

        <div className="search-page__bar">
          <div className="search-page__input-wrapper">
            <span
              className="search-page__icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search by title or author..."
              aria-label="Search books by title or author"
            />

            {hasSearchTerm && (
              <button
                type="button"
                className="search-page__clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {loading && (
          <section className="search-page__results">
            <div className="search-page__results-header">
              <div
                className="skeleton"
                style={{
                  width: "180px",
                  height: "28px",
                }}
              />
            </div>

            <div className="book-grid">
              {[1, 2, 3, 4, 5, 6].map(
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
        )}

        {!loading && error && (
          <div className="search-page__empty">
            <div className="search-page__empty-icon">
              !
            </div>

            <h2>
              Something went wrong
            </h2>

            <p>{error}</p>

            <button
              type="button"
              className="book-page__button"
              onClick={handleRetry}
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          !hasSearchTerm && (
            <div className="search-page__empty">
              <div className="search-page__empty-icon">
                ⌕
              </div>

              <h2>
                Search for a book
              </h2>

              <p>
                Enter a book title or
                author above to find
                what you're looking
                for.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          hasSearchTerm &&
          books.length > 0 && (
            <section className="search-page__results">
              <div className="search-page__results-header">
                <h2>Search results</h2>

                <span>
                  {books.length}{" "}
                  {books.length === 1
                    ? "book"
                    : "books"}
                </span>
              </div>

              <div className="book-grid">
                {books.map((book) => (
                  <Link
                    to={`/book/${book.id}`}
                    className="book-card search-book-card"
                    key={book.id}
                  >
                    <div className="book-card__image-wrapper">
                      {book.subscriptionRequired && (
                        <span className="book-card__premium">
                          Premium
                        </span>
                      )}

                      <img
                        src={book.imageLink}
                        alt={
                          book.title ||
                          "Book"
                        }
                        className="book-card__image"
                      />
                    </div>

                    <h3>{book.title}</h3>

                    <p>{book.author}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

        {!loading &&
          !error &&
          hasSearchTerm &&
          books.length === 0 && (
            <div className="search-page__empty">
              <div className="search-page__empty-icon">
                ⌕
              </div>

              <h2>No books found</h2>

              <p>
                We couldn't find any
                books matching "
                {searchTerm}".
              </p>

              <button
                type="button"
                className="book-page__button"
                onClick={handleClearSearch}
              >
                Clear search
              </button>
            </div>
          )}
      </div>
    </main>
  );
}

export default Search;
