import { useNavigate } from "react-router-dom";
import landingImage from "../assets/landing.png";

function Home() {
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate("/for-you");
  };

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero__container">
          <div className="hero__content">
            <h1>
              Learn something new
              <span> every day.</span>
            </h1>

            <p>
              Summarist helps you discover the key ideas from the world's
              greatest books in just a few minutes.
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
            <img
              src={landingImage}
              alt="Learn with Summarist"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;