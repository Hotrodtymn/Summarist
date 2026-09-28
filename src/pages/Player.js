import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

function Player() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${id}`
        );

        const data = await response.json();
        setBook(data);
      } catch (error) {
        console.error("Failed to fetch book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );
      audio.removeEventListener("ended", handleEnded);
    };
  }, [book]);

  const handlePlayPause = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSkip = (seconds) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, audio.duration || 0)
    );
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const newTime = Number(event.target.value);

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) {
      return "0:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <main className="player-page">
        <div className="player-page__container">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-player"></div>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="player-page">
        <div className="player-page__container">
          <p>Book not found.</p>

          <Link to="/for-you">
            ← Back to For You
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="player-page">
      <div className="player-page__container">
        <Link to="/for-you" className="player-page__back">
          ← Back to For You
        </Link>

        <div className="player-page__header">
          <img
            src={book.imageLink}
            alt={book.title}
            className="player-page__image"
          />

          <div>
            <h1>{book.title}</h1>
            <p>{book.author}</p>
          </div>
        </div>

        <section className="player-page__summary">
          <h2>Summary</h2>

          <p style={{ whiteSpace: "pre-line" }}>
            {book.summary}
          </p>
        </section>

        <section className="player-page__audio">
          <h2>Listen</h2>

          <audio
            ref={audioRef}
            src={book.audioLink}
            preload="metadata"
          />

          <div className="audio-player">
            <div className="audio-player__times">
              <span>{formatTime(currentTime)}</span>

              <span>{formatTime(duration)}</span>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="audio-player__seek"
              aria-label="Audio progress"
            />

            <div className="audio-player__controls">
              <button
                type="button"
                onClick={() => handleSkip(-15)}
                aria-label="Skip backward 15 seconds"
              >
                -15
              </button>

              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={
                  isPlaying ? "Pause" : "Play"
                }
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>

              <button
                type="button"
                onClick={handleStop}
                aria-label="Stop"
              >
                ■
              </button>

              <button
                type="button"
                onClick={() => handleSkip(15)}
                aria-label="Skip forward 15 seconds"
              >
                +15
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Player;