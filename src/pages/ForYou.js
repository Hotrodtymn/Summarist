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
            <h1>Unable to load books</h1>

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
                  src={selectedBook.imageLink}
                  alt={selectedBook.title}
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
      </div>
    </main>
  );
}

export default ForYou;