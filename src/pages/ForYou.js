import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BOOKS_API =
  "https://us-central1-summaristt.cloudfunctions.net/getBooks";

function ForYou() {
  const [selectedBook, setSelectedBook] =
    useState(null);

  const [recommendedBooks, setRecommendedBooks] =
    useState([]);

  const [suggestedBooks, setSuggestedBooks] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    const fetchBooks = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          selectedResponse,
          recommendedResponse,
          suggestedResponse,
        ] = await Promise.all([
          fetch(
            `${BOOKS_API}?status=selected`
          ),
          fetch(
            `${BOOKS_API}?status=recommended`
          ),
          fetch(
            `${BOOKS_API}?status=suggested`
          ),
        ]);

        if (
          !selectedResponse.ok ||
          !recommendedResponse.ok ||
          !suggestedResponse.ok
        ) {
          throw new Error(
            "Failed to fetch books."
          );
        }

        const selectedData =
          await selectedResponse.json();

        const recommendedData =
          await recommendedResponse.json();

        const suggestedData =
          await suggestedResponse.json();

        if (isCancelled) {
          return;
        }

        setSelectedBook(
          selectedData &&
          !Array.isArray(selectedData)
            ? selectedData
            : Array.isArray(
                selectedData
              )
            ? selectedData[0] || null
            : null
        );

        setRecommendedBooks(
          Array.isArray(
            recommendedData
          )
            ? recommendedData
            : []
        );

        setSuggestedBooks(
          Array.isArray(
            suggestedData
          )
            ? suggestedData
            : []
        );
      } catch (fetchError) {
        console.error(
          "Failed to fetch books:",
          fetchError
        );

        if (!isCancelled) {
          setSelectedBook(null);
          setRecommendedBooks([]);
          setSuggestedBooks([]);
          setError(
            "Unable to load your books. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      isCancelled = true;
    };
  }, []);

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  const matchesSearch = (book) => {
    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      book.title,
      book.author,
      book.subTitle,
      book.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      normalizedSearch
    );
  };

  const filteredSelectedBook =
    selectedBook &&
    matchesSearch(selectedBook)
      ? selectedBook
      : null;

  const filteredRecommendedBooks =
    recommendedBooks.filter(
      matchesSearch
    );

  const filteredSuggestedBooks =
    suggestedBooks.filter(
      matchesSearch
    );

  const totalSearchResults =
    (filteredSelectedBook ? 1 : 0) +
    filteredRecommendedBooks.length +
    filteredSuggestedBooks.length;

  if (loading) {
    return (
      <main className="for-you">
        <div className="books__container">
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

  if (error) {
    return (
      <main className="for-you">
        <div className="books__container">
          <div className="library__empty">
            <h1>
              Unable to load books
            </h1>

            <p>{error}</p>

            <button
              type="button"
              className="book-page__button"
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="for-you">
      <div className="books__container">
        {/* Search */}
        <section className="for-you__search">
          <div className="for-you__search-wrapper">
            <span
              className="for-you__search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              className="for-you__search-input"
              placeholder="Search books, authors, or topics..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              aria-label="Search books"
            />

            {searchTerm && (
              <button
                type="button"
                className="for-you__search-clear"
                onClick={() =>
                  setSearchTerm("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* Search Results */}
        {normalizedSearch ? (
          <>
            <div className="for-you__search-results">
              <h1>Search results</h1>

              <p>
                {totalSearchResults}{" "}
                {totalSearchResults === 1
                  ? "book"
                  : "books"}{" "}
                found for "
                {searchTerm}"
              </p>
            </div>

            {totalSearchResults === 0 ? (
              <div className="for-you__no-results">
                <div className="for-you__no-results-icon">
                  🔎
                </div>

                <h2>
                  No books found
                </h2>

                <p>
                  Try searching for a
                  different title, author,
                  or topic.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                {filteredSelectedBook && (
                  <section className="selected-book">
                    <Link
                      to={`/book/${filteredSelectedBook.id}`}
                    >
                      <div className="selected-book__image-wrapper">
                        {filteredSelectedBook.subscriptionRequired && (
                          <span className="book-card__premium">
                            Premium
                          </span>
                        )}

                        <img
                          src={
                            filteredSelectedBook.imageLink
                          }
                          alt={
                            filteredSelectedBook.title
                          }
                        />
                      </div>

                      <div className="selected-book__content">
                        <h1>
                          {
                            filteredSelectedBook.title
                          }
                        </h1>

                        <p>
                          {
                            filteredSelectedBook.author
                          }
                        </p>

                        {filteredSelectedBook.subTitle && (
                          <p>
                            {
                              filteredSelectedBook.subTitle
                            }
                          </p>
                        )}
                      </div>
                    </Link>
                  </section>
                )}

                {filteredRecommendedBooks.length >
                  0 && (
                  <section className="book-section">
                    <h2>
                      Recommended For You
                    </h2>

                    <div className="book-grid">
                      {filteredRecommendedBooks.map(
                        (book) => (
                          <Link
                            to={`/book/${book.id}`}
                            className="book-card"
                            key={book.id}
                          >
                            <div className="book-card__image-wrapper">
                              {book.subscriptionRequired && (
                                <span className="book-card__premium">
                                  Premium
                                </span>
                              )}

                              <img
                                src={
                                  book.imageLink
                                }
                                alt={
                                  book.title
                                }
                                className="book-card__image"
                              />
                            </div>

                            <h3>
                              {book.title}
                            </h3>

                            <p>
                              {book.author}
                            </p>
                          </Link>
                        )
                      )}
                    </div>
                  </section>
                )}

                {filteredSuggestedBooks.length >
                  0 && (
                  <section className="book-section">
                    <h2>
                      Suggested For You
                    </h2>

                    <div className="book-grid">
                      {filteredSuggestedBooks.map(
                        (book) => (
                          <Link
                            to={`/book/${book.id}`}
                            className="book-card"
                            key={book.id}
                          >
                            <div className="book-card__image-wrapper">
                              {book.subscriptionRequired && (
                                <span className="book-card__premium">
                                  Premium
                                </span>
                              )}

                              <img
                                src={
                                  book.imageLink
                                }
                                alt={
                                  book.title
                                }
                                className="book-card__image"
                              />
                            </div>

                            <h3>
                              {book.title}
                            </h3>

                            <p>
                              {book.author}
                            </p>
                          </Link>
                        )
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Selected Book */}
            {selectedBook && (
              <section className="selected-book">
                <Link
                  to={`/book/${selectedBook.id}`}
                >
                  <div className="selected-book__image-wrapper">
                    {selectedBook.subscriptionRequired && (
                      <span className="book-card__premium">
                        Premium
                      </span>
                    )}

                    <img
                      src={
                        selectedBook.imageLink
                      }
                      alt={
                        selectedBook.title
                      }
                    />
                  </div>

                  <div className="selected-book__content">
                    <h1>
                      {selectedBook.title}
                    </h1>

                    <p>
                      {selectedBook.author}
                    </p>

                    {selectedBook.subTitle && (
                      <p>
                        {selectedBook.subTitle}
                      </p>
                    )}
                  </div>
                </Link>
              </section>
            )}

            {/* Recommended */}
            <section className="book-section">
              <h2>
                Recommended For You
              </h2>

              {recommendedBooks.length > 0 ? (
                <div className="book-grid">
                  {recommendedBooks.map(
                    (book) => (
                      <Link
                        to={`/book/${book.id}`}
                        className="book-card"
                        key={book.id}
                      >
                        <div className="book-card__image-wrapper">
                          {book.subscriptionRequired && (
                            <span className="book-card__premium">
                              Premium
                            </span>
                          )}

                          <img
                            src={
                              book.imageLink
                            }
                            alt={
                              book.title
                            }
                            className="book-card__image"
                          />
                        </div>

                        <h3>
                          {book.title}
                        </h3>

                        <p>
                          {book.author}
                        </p>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <div className="library-empty">
                  <p>
                    No recommended books
                    are available right
                    now.
                  </p>
                </div>
              )}
            </section>

            {/* Suggested */}
            <section className="book-section">
              <h2>
                Suggested For You
              </h2>

              {suggestedBooks.length > 0 ? (
                <div className="book-grid">
                  {suggestedBooks.map(
                    (book) => (
                      <Link
                        to={`/book/${book.id}`}
                        className="book-card"
                        key={book.id}
                      >
                        <div className="book-card__image-wrapper">
                          {book.subscriptionRequired && (
                            <span className="book-card__premium">
                              Premium
                            </span>
                          )}

                          <img
                            src={
                              book.imageLink
                            }
                            alt={
                              book.title
                            }
                            className="book-card__image"
                          />
                        </div>

                        <h3>
                          {book.title}
                        </h3>

                        <p>
                          {book.author}
                        </p>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <div className="library-empty">
                  <p>
                    No suggested books are
                    available right now.
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default ForYou;