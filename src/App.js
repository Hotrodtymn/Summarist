import "./App.css";


function App() {
  return (
    <div className="App">
      <header className="navbar">
        <div className="navbar__container">
          <div className="navbar__logo">
            <span>summarist</span>
          </div>

          <nav className="navbar__links">
            <a href="/">For you</a>
            <a href="/">Library</a>
            <a href="/">My account</a>
          </nav>

          <button className="navbar__button">
            Log in
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__container">
            <div className="hero__content">
              <h1>
                Learn something new
                <span> every day.</span>
              </h1>

              <p>
                Summarist gives you the key ideas from the world's best
                nonfiction books in just a few minutes.
              </p>

              <button className="hero__button">
                Start learning
              </button>
            </div>
          </div>
        </section>

        <section className="books">
          <div className="books__container">
            <h2>Popular books</h2>

            <div className="books__grid">
              <div className="book-card">
                <img
                  src={atomicHabits}
                  alt="Atomic Habits"
                  className="book-card__image"
                />

                <h3>Atomic Habits</h3>
                <p>James Clear</p>
              </div>

              <div className="book-card">
                <img
                  src={sevenHabits}
                  alt="The 7 Habits of Highly Effective People"
                  className="book-card__image"
                />

                <h3>The 7 Habits of Highly Effective People</h3>
                <p>Stephen R. Covey</p>
              </div>

              <div className="book-card">
                <img
                  src={howToWinFriends}
                  alt="How to Win Friends and Influence People"
                  className="book-card__image"
                />

                <h3>How to Win Friends and Influence People</h3>
                <p>Dale Carnegie</p>
              </div>

              <div className="book-card">
                <img
                  src={richDadPoorDad}
                  alt="Rich Dad Poor Dad"
                  className="book-card__image"
                />

                <h3>Rich Dad Poor Dad</h3>
                <p>Robert Kiyosaki</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;