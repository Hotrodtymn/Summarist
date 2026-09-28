import landing from "../assets/landing.png";

function Home() {
  return (
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

          <div className="hero__image">
            <img src={landing} alt="Summarist books" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;