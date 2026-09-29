import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  get,
  ref,
  set,
} from "firebase/database";

import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const audioRef = useRef(null);
  const progressSaveTimeoutRef = useRef(null);
  const hasLoadedSavedProgressRef = useRef(false);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [savedProgress, setSavedProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSavingProgress, setIsSavingProgress] =
    useState(false);

  useEffect(() => {
    hasLoadedSavedProgressRef.current = false;
    setSavedProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsFinished(false);
  }, [id]);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError("Book not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const functions = getFunctions();

        const getProtectedBook =
          httpsCallable(
            functions,
            "getProtectedBook"
          );

        const result = await getProtectedBook({
          bookId: id,
        });

        const protectedBook =
          result.data?.book || result.data;

        if (!protectedBook) {
          throw new Error(
            "Book information was not returned."
          );
        }

        setBook(protectedBook);
      } catch (error) {
        console.error(
          "Failed to load protected book:",
          error
        );

        setError(
          error?.message ||
            "Unable to load this book."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!currentUser || !id) {
        hasLoadedSavedProgressRef.current = true;
        return;
      }

      try {
        const bookRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}`
        );

        const snapshot = await get(bookRef);

        if (!snapshot.exists()) {
          hasLoadedSavedProgressRef.current = true;
          return;
        }

        const libraryBook = snapshot.val();

        const progress = Number(
          libraryBook.progress
        );

        const savedDuration = Number(
          libraryBook.duration
        );

        if (
          Number.isFinite(progress) &&
          progress > 0
        ) {
          setSavedProgress(progress);
        }

        if (
          Number.isFinite(savedDuration) &&
          savedDuration > 0
        ) {
          setDuration(savedDuration);
        }

        setIsFinished(
          libraryBook.finished === true
        );
      } catch (error) {
        console.error(
          "Failed to load saved progress:",
          error
        );
      } finally {
        hasLoadedSavedProgressRef.current = true;
      }
    };

    loadSavedProgress();
  }, [currentUser, id]);

  useEffect(() => {
    return () => {
      if (
        progressSaveTimeoutRef.current
      ) {
        clearTimeout(
          progressSaveTimeoutRef.current
        );
      }
    };
  }, []);

  const saveProgress = async (
    progressValue,
    finished = false
  ) => {
    if (!currentUser || !id) {
      return;
    }

    const progress = Number(
      progressValue
    );

    const audioDuration = Number(
      duration || audioRef.current?.duration
    );

    if (
      !Number.isFinite(progress) ||
      progress < 0
    ) {
      return;
    }

    try {
      setIsSavingProgress(true);

      const bookRef = ref(
        database,
        `users/${currentUser.uid}/library/${id}`
      );

      const snapshot = await get(bookRef);

      if (!snapshot.exists()) {
        return;
      }

      const libraryBook = snapshot.val();

      await set(bookRef, {
        ...libraryBook,
        progress,
        duration:
          Number.isFinite(audioDuration) &&
          audioDuration > 0
            ? audioDuration
            : libraryBook.duration ||
              null,
        finished,
        ...(finished
          ? {
              finishedAt: Date.now(),
            }
          : {}),
        lastPlayedAt: Date.now(),
      });
    } catch (error) {
      console.error(
        "Failed to save playback progress:",
        error
      );
    } finally {
      setIsSavingProgress(false);
    }
  };

  const scheduleProgressSave = (
    progressValue
  ) => {
    if (
      progressSaveTimeoutRef.current
    ) {
      clearTimeout(
        progressSaveTimeoutRef.current
      );
    }

    progressSaveTimeoutRef.current =
      setTimeout(() => {
        saveProgress(progressValue);
      }, 1000);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const audioDuration = audio.duration;

    if (
      Number.isFinite(audioDuration) &&
      audioDuration > 0
    ) {
      setDuration(audioDuration);

      if (
        currentUser &&
        id &&
        hasLoadedSavedProgressRef.current
      ) {
        const resumePosition =
          Number(savedProgress);

        if (
          resumePosition > 0 &&
          resumePosition < audioDuration &&
          !isFinished
        ) {
          audio.currentTime =
            resumePosition;

          setCurrentTime(
            resumePosition
          );
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const time = audio.currentTime;

    setCurrentTime(time);

    if (
      currentUser &&
      !isFinished
    ) {
      scheduleProgressSave(time);
    }
  };

  const handlePlay = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error(
        "Unable to play audio:",
        error
      );
    }
  };

  const handlePause = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);

    await saveProgress(
      audio.currentTime
    );
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleStop = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    await saveProgress(
      audio.currentTime
    );

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

    const newTime = Math.min(
      Math.max(
        audio.currentTime + seconds,
        0
      ),
      audio.duration || 0
    );

    audio.currentTime = newTime;
    setCurrentTime(newTime);

    scheduleProgressSave(newTime);
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

    scheduleProgressSave(newTime);
  };

  const handlePlaybackRateChange = (
    event
  ) => {
    const newRate = Number(
      event.target.value
    );

    const audio = audioRef.current;

    if (
      !audio ||
      !Number.isFinite(newRate)
    ) {
      return;
    }

    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const handleEnded = async () => {
    const audio = audioRef.current;

    setIsPlaying(false);
    setCurrentTime(
      audio?.duration || duration
    );
    setIsFinished(true);

    await saveProgress(
      audio?.duration || duration,
      true
    );
  };

  const handleBeforeUnload = () => {
    const audio = audioRef.current;

    if (
      !audio ||
      !currentUser ||
      !id
    ) {
      return;
    }

    const progress = audio.currentTime;

    if (
      !Number.isFinite(progress) ||
      progress <= 0
    ) {
      return;
    }

    saveProgress(progress);
  };

  useEffect(() => {
    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  });

  const formatTime = (time) => {
    const value = Number(time);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return "0:00";
    }

    const hours = Math.floor(
      value / 3600
    );

    const minutes = Math.floor(
      (value % 3600) / 60
    );

    const seconds = Math.floor(
      value % 60
    );

    if (hours > 0) {
      return `${hours}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBack = async () => {
    const audio = audioRef.current;

    if (
      audio &&
      currentUser &&
      !isFinished
    ) {
      await saveProgress(
        audio.currentTime
      );
    }

    if (id) {
      navigate(`/book/${id}`);
      return;
    }

    navigate(-1);
  };

  if (loading) {
    return (
      <main className="player">
        <div className="player__container">
          <div className="player__loading">
            Loading book...
          </div>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="player">
        <div className="player__container">
          <button
            type="button"
            className="player__back"
            onClick={() =>
              navigate(
                id
                  ? `/book/${id}`
                  : "/library"
              )
            }
          >
            ← Back to Book
          </button>

          <div className="player__error">
            <h1>
              Unable to load this book
            </h1>

            <p>
              {error ||
                "The book could not be loaded."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const audioUrl =
    book.audioLink ||
    book.audioUrl ||
    book.audio;

  return (
    <main className="player">
      <div className="player__container">
        <button
          type="button"
          className="player__back"
          onClick={handleBack}
        >
          ← Back to Book
        </button>

        <div className="player__content">
          <div className="player__book">
            {book.imageLink && (
              <img
                src={book.imageLink}
                alt={book.title}
                className="player__image"
              />
            )}

            <div className="player__info">
              <h1>{book.title}</h1>

              {book.author && (
                <p className="player__author">
                  {book.author}
                </p>
              )}

              {book.subTitle && (
                <p className="player__subtitle">
                  {book.subTitle}
                </p>
              )}

              {book.description && (
                <div className="player__description">
                  <h2>Summary</h2>

                  <p>
                    {book.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          <section
            className="player__controls"
            aria-label="Audio player controls"
          >
            {audioUrl ? (
              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={
                  handleLoadedMetadata
                }
                onTimeUpdate={
                  handleTimeUpdate
                }
                onEnded={handleEnded}
                preload="metadata"
              />
            ) : (
              <p className="player__error">
                Audio is not available for
                this book.
              </p>
            )}

            <div className="player__progress">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(
                  currentTime,
                  duration || 0
                )}
                onChange={handleSeek}
                disabled={!audioUrl}
                aria-label="Audio progress"
              />

              <div className="player__time">
                <span>
                  {formatTime(currentTime)}
                </span>

                <span>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <div className="player__buttons">
              <button
                type="button"
                onClick={() =>
                  handleSkip(-15)
                }
                disabled={!audioUrl}
                aria-label="Skip backward 15 seconds"
              >
                −15
              </button>

              <button
                type="button"
                className="player__play"
                onClick={handleTogglePlay}
                disabled={!audioUrl}
                aria-label={
                  isPlaying
                    ? "Pause"
                    : "Play"
                }
              >
                {isPlaying
                  ? "Pause"
                  : "Play"}
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSkip(15)
                }
                disabled={!audioUrl}
                aria-label="Skip forward 15 seconds"
              >
                +15
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={!audioUrl}
              >
                Stop
              </button>
            </div>

            <div className="player__speed">
              <label htmlFor="playback-speed">
                Playback speed
              </label>

              <select
                id="playback-speed"
                value={playbackRate}
                onChange={
                  handlePlaybackRateChange
                }
                disabled={!audioUrl}
              >
                <option value="0.75">
                  0.75x
                </option>

                <option value="1">
                  1x
                </option>

                <option value="1.25">
                  1.25x
                </option>

                <option value="1.5">
                  1.5x
                </option>

                <option value="1.75">
                  1.75x
                </option>

                <option value="2">
                  2x
                </option>
              </select>
            </div>

            {isSavingProgress && (
              <div className="player__saving">
                Saving progress...
              </div>
            )}

            {savedProgress > 0 &&
              currentTime === 0 &&
              !isFinished && (
                <div className="player__resume">
                  Your previous position will
                  be restored when the audio
                  loads.
                </div>
              )}

            {isFinished && (
              <div className="player__finished">
                ✓ Finished
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Player;