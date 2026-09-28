
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  get,
  ref,
  update,
} from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

function Player() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

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
    const checkFinished = async () => {
      if (!currentUser || !id) {
        return;
      }

      try {
        const bookRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}`
        );

        const snapshot = await get(bookRef);

        if (snapshot.exists()) {
          const libraryBook = snapshot.val();

          setIsFinished(libraryBook.finished === true);
        }
      } catch (error) {
        console.error(
          "Failed to check finished status:",
          error
        );
      }
    };

    checkFinished();
  }, [currentUser, id]);

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

    const handleEnded = async () => {
      setIsPlaying(false);
      setCurrentTime(0);

      if (!currentUser || !book) {
        return;
      }

      try {
        const bookRef = ref(
          database,
          `users/${currentUser.uid}/library/${book.id}`
        );

        const snapshot = await get(bookRef);

        if (!snapshot.exists()) {
          return;
        }

        await update(bookRef, {
          finished: true,
          finishedAt: Date.now(),
        });

        setIsFinished(true);
      } catch (error) {
        console.error(
          "Failed to mark book as finished:",
          error
        );
      }
    };

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    audio.addEventListener(
      "ended",
      handleEnded
    );

    return () => {
      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );

      audio.removeEventListener(
        "ended",
        handleEnded
      );
    };
  }, [book, currentUser]);

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
      Math.min(
        audio.currentTime + seconds,
        audio.duration || 0
      )
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
          <div className="player-page__header">
            <div
              className="skeleton"
              style={{
                width: "220px",
                height: "330px",
              }}
            />

            <div style={{ flex: 1 }}>
              <div
                className="skeleton"
                style={{
                  width: "70%",
                  height: "40px",
                  marginBottom: "20px",
                }}
              />

              <div
                className="skeleton"
                style={{
                  width: "40%",
                  height: "20px",
                }}
              />
            </div>
          </div>

          <div
            className="skeleton"
            style={{
              width: "100%",
              height: "200px",
            }}
          />
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="player-page">
        <div className="player-page__container">
          <h1>Book not found</h1>

          <Link to="/for-you">
            Back to For You
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="player-page">
      <div className="player-page__container">
        <Link
          to={`/book/${book.id}`}
          className="book-page__back"
        >
          ← Back to Book
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

            {isFinished && (
              <p
                style={{
                  marginTop: "15px",
                  fontWeight: "700",
                  color: "#2bd97c",
                }}
              >
                Finished
              </p>
            )}
          </div>
        </div>

        <section className="player-page__summary">
          <h2>Summary</h2>

          <p>{book.description}</p>
        </section>

        <section className="audio-player">
          <audio
            ref={audioRef}
            src={book.audioLink}
            preload="metadata"
          />

          <input
            type="range"
            className="audio-player__progress"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
          />

          <div className="audio-player__times">
            <span>{formatTime(currentTime)}</span>

            <span>{formatTime(duration)}</span>
          </div>

          <div className="audio-player__controls">
            <button
              type="button"
              className="audio-player__button"
              onClick={() => handleSkip(-15)}
            >
              -15
            </button>

            <button
              type="button"
              className="audio-player__button"
              onClick={handleStop}
            >
              ■
            </button>

            <button
              type="button"
              className="audio-player__button audio-player__button--main"
              onClick={handlePlayPause}
            >
              {isPlaying ? "Ⅱ" : "▶"}
            </button>

            <button
              type="button"
              className="audio-player__button"
              onClick={() => handleSkip(15)}
            >
              +15
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Player;