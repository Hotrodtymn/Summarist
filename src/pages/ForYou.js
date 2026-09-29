import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ForYou() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [suggestedBooks, setSuggestedBooks] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const [selectedResponse, recommendedResponse, suggestedResponse] =
          await Promise.all([
            fetch(
              "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=selected"
            ),
            fetch(
              "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=recommended"
            ),
            fetch(
              "https://us-central1-summaristt.cloudfunctions.net/getBooks?status=suggested"
            ),
          ]);

        const selectedData = await selectedResponse.json();
        const recommendedData = await recommendedResponse.json();
        const suggestedData = await suggestedResponse.json();

        setSelectedBook(selectedData);
        setRecommendedBooks(recommendedData);
        setSuggestedBooks(suggestedData);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <main className="for-you">
        <div className="books__container">
          <div className="skeleton skeleton__selected"></div>

          <div className="skeleton__grid">
            {new Array(6).fill(0).map((_, index) => (
              <div className="skeleton skeleton__book" key={index}></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="for-you">
      <div className="books__container">
        {/* SELECTED BOOK */}

        {selectedBook && (
          <section className="selected-book">
            <Link to={`/book/${selectedBook.id}`}>
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
                <h1>{selectedBook.title}</h1>

                <p>{selectedBook.author}</p>

                <p>{selectedBook.subTitle}</p>
              </div>
            </Link>
          </section>
        )}

        {/* RECOMMENDED */}

        <section className="book-section">
          <h2>Recommended For You</h2>

          <div className="book-grid">
            {recommendedBooks.map((book) => (
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
                    src={book.imageLink}
                    alt={book.title}
                    className="book-card__image"
                  />
                </div>

                <h3>{book.title}</h3>

                <p>{book.author}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* SUGGESTED */}

        <section className="book-section">
          <h2>Suggested For You</h2>

          <div className="book-grid">
            {suggestedBooks.map((book) => (
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
                    src={book.imageLink}
                    alt={book.title}
                    className="book-card__image"
                  />
                </div>

                <h3>{book.title}</h3>

                <p>{book.author}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ForYou;