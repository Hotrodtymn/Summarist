import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  get,
  ref,
  update,
} from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { isPremiumUser } from "../utils/subscription";

const BOOK_API =
  "https://us-central1-summaristt.cloudfunctions.net/getBook";

function Player() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    currentUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const audioRef = useRef(null);

  const [book, setBook] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadBook = async () => {
      if (!id) {
        setError(
          "No book was selected."
        );
        setLoading(false);
        setCheckingAccess(false);
        return;
      }

      setLoading(true);
      setCheckingAccess(true);
      setError("");
      setBook(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      try {
        const response = await fetch(
          `${BOOK_API}?id=${encodeURIComponent(
            id
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load this book."
          );
        }

        const data =
          await response.json();

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "The book data was invalid."
          );
        }

        if (!isCancelled) {
          setBook(data);
        }
      } catch (loadError) {
        console.error(
          "Failed to load player:",
          loadError
        );

        if (!isCancelled) {
          setError(
            "Unable to load this book. Please try again."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadBook();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (
      authLoading ||
      loading ||
      !book
    ) {
      return;
    }

    let isCancelled = false;

    const checkAccess = async () => {
      setCheckingAccess(true);

      if (
        !currentUser ||
        !isAuthenticated
      ) {
        if (!isCancelled) {
          navigate(`/book/${id}`, {
            replace: true,
          });
        }

        return;
      }

      if (!book.subscriptionRequired) {
        if (!isCancelled) {
          setCheckingAccess(false);
        }

        return;
      }

      try {
        const premium =
          await isPremiumUser(
            currentUser.uid
          );

        if (isCancelled) {
          return;
        }

        if (!premium) {
          navigate("/choose-plan", {
            replace: true,
          });

          return;
        }

        setCheckingAccess(false);
      } catch (accessError) {
        console.error(
          "Failed to check player access:",
          accessError
        );

        if (!isCancelled) {
          navigate("/choose-plan", {
            replace: true,
          });
        }
      }
    };

    checkAccess();

    return () => {
      isCancelled = true;
    };
  }, [
    authLoading,
    loading,
    book,
    currentUser,
    isAuthenticated,
    id,
    navigate,
  ]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;

      if (audio) {
        audio.pause();
      }
    };
  }, [id]);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      setDuration(audio.duration);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setCurrentTime(
      audio.currentTime
    );
  };

  const handleAudioError = () => {
    console.error(
      "Audio failed to load:",
      book?.audioLink
    );

    setError(
      "The book loaded, but its audio could not be played."
    );
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (playError) {
      console.error(
        "Playback failed:",
        playError
      );

      setError(
        "The audio could not be played. Please try again."
      );
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

    const maxTime =
      Number.isFinite(audio.duration) &&
      audio.duration > 0
        ? audio.duration
        : 0;

    const newTime = Math.min(
      Math.max(
        audio.currentTime + seconds,
        0
      ),
      maxTime
    );

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const newTime = Number(
      event.target.value
    );

    if (!Number.isFinite(newTime)) {
      return;
    }

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const markBookAsFinished =
    async () => {
      if (
        !currentUser ||
        !isAuthenticated ||
        !id
      ) {
        return;
      }

      try {
        const libraryRef = ref(
          database,
          `users/${currentUser.uid}/library/${String(
            id
          )}`
        );

        const snapshot =
          await get(libraryRef);

        if (!snapshot.exists()) {
          return;
        }

        await update(libraryRef, {
          finished: true,
          finishedAt: Date.now(),
        });
      } catch (finishError) {
        console.error(
          "Failed to mark book as finished:",
          finishError
        );
      }
    };

  const handleEnded = async () => {
    setIsPlaying(false);
    setCurrentTime(duration);

    await markBookAsFinished();
  };

  const formatTime = (time) => {
    const value = Number(time);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return "0:00";
    }

    const minutes = Math.floor(
      value / 60
    );

    const seconds = Math.floor(
      value % 60
    );

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (
    authLoading ||
    loading ||
    checkingAccess
  ) {
    return (
      <main className="player">
        <div className="player__container">
          <div className="player__loading">
            <div className="skeleton player__loading-image"></div>

            <div className="player__loading-info">
              <div className="skeleton player__loading-title"></div>

              <div className="skeleton player__loading-author"></div>

              <div className="skeleton player__loading-text"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="player">
        <div className="player__container">
          <div className="player__error">
            <h1>
              Unable to play this book
            </h1>

            <p>{error}</p>

            <div className="player__actions">
              <Link
                to={`/book/${id}`}
                className="book-page__button"
              >
                Back to Book
              </Link>

              <Link
                to="/for-you"
                className="book-page__button book-page__button--secondary"
              >
                Back to For You
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="player">
        <div className="player__container">
          <div className="player__error">
            <h1>
              Book data unavailable
            </h1>

            <p>
              The player loaded, but no
              book information was
              returned.
            </p>

            <button
              type="button"
              className="book-page__button"
              onClick={() =>
                navigate(-1)
              }
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const audioSource =
    book.audioLink || "";

  const summary =
    book.bookDescription ||
    book.description ||
    book.summary ||
    "No summary available for this book.";

  return (
    <main className="player">
      <div className="player__container">
        <button
          type="button"
          className="player__back"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Back
        </button>

        <div className="player__content">
          <div className="player__image-wrapper">
            <img
              src={book.imageLink}
              alt={
                book.title || "Book"
              }
              className="player__image"
            />
          </div>

          <div className="player__info">
            <p className="player__label">
              Now Playing
            </p>

            <h1>{book.title}</h1>

            <p className="player__author">
              {book.author}
            </p>

            <div className="player__audio">
              {!audioSource ? (
                <div className="player__audio-error">
                  <strong>
                    Audio unavailable
                  </strong>

                  <p>
                    This book does not
                    have an audio file
                    available.
                  </p>
                </div>
              ) : (
                <>
                  <audio
                    ref={audioRef}
                    src={audioSource}
                    preload="metadata"
                    onLoadedMetadata={
                      handleLoadedMetadata
                    }
                    onTimeUpdate={
                      handleTimeUpdate
                    }
                    onEnded={
                      handleEnded
                    }
                    onError={
                      handleAudioError
                    }
                    onPlay={() =>
                      setIsPlaying(
                        true
                      )
                    }
                    onPause={() =>
                      setIsPlaying(
                        false
                      )
                    }
                  />

                  <div className="player__controls">
                    <button
                      type="button"
                      onClick={() =>
                        handleSkip(-15)
                      }
                      aria-label="Skip back 15 seconds"
                    >
                      -15
                    </button>

                    <button
                      type="button"
                      className="player__play"
                      onClick={
                        handlePlayPause
                      }
                      aria-label={
                        isPlaying
                          ? "Pause"
                          : "Play"
                      }
                    >
                      {isPlaying
                        ? "❚❚"
                        : "▶"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSkip(15)
                      }
                      aria-label="Skip forward 15 seconds"
                    >
                      +15
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleStop
                      }
                    >
                      Stop
                    </button>
                  </div>

                  <div className="player__progress-wrapper">
                    <span className="player__time">
                      {formatTime(
                        currentTime
                      )}
                    </span>

                    <input
                      className="player__progress"
                      type="range"
                      min="0"
                      max={
                        duration || 0
                      }
                      step="0.1"
                      value={Math.min(
                        currentTime,
                        duration || 0
                      )}
                      onChange={
                        handleSeek
                      }
                      disabled={
                        !duration
                      }
                      aria-label="Audio progress"
                    />

                    <span className="player__time">
                      {formatTime(
                        duration
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="player__summary">
              <h2>Summary</h2>

              <p>{summary}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Player;