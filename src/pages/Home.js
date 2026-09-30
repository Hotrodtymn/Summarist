import { useNavigate } from "react-router-dom";
import landingImage from "../assets/landing.png";

function Home() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate("/for-you");
  };

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero__container">
          <div className="hero__content">
            <h1>
              Gain more knowledge
              <span> in less time.</span>
            </h1>

            <p>
              Great summaries for busy people, individuals who barely have
              time to read, and even people who don't like to read.
            </p>

            <button
              type="button"
              className="hero__button"
              onClick={handleStartLearning}
            >
              Start learning
            </button>
          </div>

          <div className="hero__image">
            <img src={landingImage} alt="Learn with Summarist" />
          </div>
        </div>
      </section>

      {/* UNDERSTAND BOOKS */}
      <section className="home-section home-section--light">
        <div className="home-section__container">
          <div className="home-section__content">
            <h2>Understand books in few minutes</h2>

            <div className="home-feature">
              <div className="home-feature__icon">📖</div>
              <div>
                <h3>Read or listen</h3>
                <p>
                  Save time by getting the core ideas from the best books.
                </p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature__icon">🔎</div>
              <div>
                <h3>Find your next read</h3>
                <p>
                  Explore book lists and personalized recommendations.
                </p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature__icon">🎧</div>
              <div>
                <h3>Briefcasts</h3>
                <p>
                  Listen to short, focused summaries whenever you have a
                  spare moment.
                </p>
              </div>
            </div>
          </div>

          <div className="home-section__visual">
            <div className="home-book-stack">
              <div className="home-book-stack__card home-book-stack__card--one">
                Learn
              </div>
              <div className="home-book-stack__card home-book-stack__card--two">
                Grow
              </div>
              <div className="home-book-stack__card home-book-stack__card--three">
                Succeed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="home-section home-section--purple">
        <div className="home-section__container home-section__container--center">
          <h2>Enhance your knowledge</h2>

          <div className="home-benefits">
            <div className="home-benefit">
              <span>💡</span>
              <h3>Achieve greater success</h3>
            </div>

            <div className="home-benefit">
              <span>❤️</span>
              <h3>Improve your health</h3>
            </div>

            <div className="home-benefit">
              <span>👨‍👩‍👧</span>
              <h3>Develop better parenting skills</h3>
            </div>

            <div className="home-benefit">
              <span>😊</span>
              <h3>Increase happiness</h3>
            </div>

            <div className="home-benefit">
              <span>🚀</span>
              <h3>Be the best version of yourself!</h3>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="home-section home-section--stats">
        <div className="home-section__container home-section__container--center">
          <h2>Why Summarist?</h2>

          <div className="home-stats">
            <div className="home-stat">
              <strong>93%</strong>
              <p>of members significantly increase reading frequency.</p>
            </div>

            <div className="home-stat">
              <strong>96%</strong>
              <p>of members establish better habits.</p>
            </div>

            <div className="home-stat">
              <strong>90%</strong>
              <p>have made significant positive changes to their lives.</p>
            </div>

            <div className="home-stat">
              <strong>91%</strong>
              <p>report feeling more productive.</p>
            </div>

            <div className="home-stat">
              <strong>94%</strong>
              <p>have noticed improved comprehension and retention.</p>
            </div>

            <div className="home-stat">
              <strong>88%</strong>
              <p>feel more informed about current events and trends.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GOALS */}
      <section className="home-section home-section--light">
        <div className="home-section__container home-section__container--center">
          <h2>Expand your learning</h2>

          <div className="home-goals">
            <div>Accomplish your goals</div>
            <div>Strengthen your vitality</div>
            <div>Become a better caregiver</div>
            <div>Improve your mood</div>
            <div>Maximize your abilities</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="home-section home-section--testimonials">
        <div className="home-section__container home-section__container--center">
          <h2>What our members say</h2>

          <div className="home-testimonials">
            <article className="home-testimonial">
              <h3>Hanna M.</h3>
              <p>
                This app has been a game-changer for me! It's saved me so much
                time and effort in reading and comprehending books. Highly
                recommend it to all book lovers.
              </p>
            </article>

            <article className="home-testimonial">
              <h3>David B.</h3>
              <p>
                I love this app! It provides concise and accurate summaries of
                books in a way that is easy to understand. It's also very
                user-friendly and intuitive.
              </p>
            </article>

            <article className="home-testimonial">
              <h3>Nathan S.</h3>
              <p>
                This is a great way to get the main takeaways from a book
                without having to read the entire thing. The summaries are
                well-written and informative.
              </p>
            </article>

            <article className="home-testimonial">
              <h3>Ryan R.</h3>
              <p>
                If you're a busy person who loves reading but doesn't have the
                time to read every book in full, this app is for you.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-cta">
        <div className="home-cta__container">
          <h2>Start growing with Summarist now</h2>

          <button
            type="button"
            className="home-cta__button"
            onClick={handleStartLearning}
          >
            Start learning
          </button>

          <div className="home-cta__stats">
            <div>
              <strong>3 Million</strong>
              <span>Downloads on all platforms</span>
            </div>

            <div>
              <strong>4.5 Stars</strong>
              <span>Average ratings on iOS and Google Play</span>
            </div>

            <div>
              <strong>97%</strong>
              <span>Of members create a better reading habit</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;