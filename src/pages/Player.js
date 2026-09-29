import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { ref, get, update } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../context/AuthContext";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const audioRef = useRef(null);

  const [book, setBook] = useState(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessError, setAccessError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true);
        setAccessError("");

        if (!currentUser) {
          setAccessError("You must be signed in to listen to this book.");
          setHasAccess(false);
          return;
        }

        const functions = getFunctions();
        const getProtectedBook = httpsCallable(
          functions,
          "getProtectedBook"
        );

        const result = await getProtectedBook({
          bookId: id,
        });

        const protectedBook = result.data;

        setBook(protectedBook);
        setHasAccess(true);

        const finishedRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}/finished`
        );

        const snapshot = await get(finishedRef);

        if (snapshot.exists()) {
          setFinished(snapshot.val());
        }
      } catch (error) {
        console.error("Failed to load protected book:", error);

        if (error.code === "functions/permission-denied") {
          setAccessError(
            "This book requires a Premium subscription."
          );
        } else if (error.code === "functions/unauthenticated") {
          setAccessError(
            "You must be signed in to listen to this book."
          );
        } else {
          setAccessError("Unable to load this book.");
        }

        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id, currentUser]);

  useEffect(() => {
    if (!hasAccess || !book || !audioRef.current) {
      return;
    }

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = async () => {
      setIsPlaying(false);
      setFinished(true);

      if (!currentUser) {
        return;
      }

      try {
        const finishedRef = ref(
          database,
          `users/${currentUser.uid}/library/${id}`
        );

        await update(finishedRef, {
          finished: true,
        });
      } catch (error) {
        console.error(
          "Failed to update finished status:",
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
  }, [hasAccess, book, currentUser, id]);

  const handlePlayPause = () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (event) => {
    const newTime = Number(event.target.value);

    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds) => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.currentTime = Math.max(
      0,
      Math.min(
        audioRef.current.currentTime + seconds,
        duration
      )
    );
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
      <div className="player">
        <div className="player__container">
          <div className="player__skeleton"></div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="player">
        <div className="player__container">
          <button
            className="player__back"
            onClick={() => navigate(`/book/${id}`)}
          >
            ← Back to Book
          </button>

          <div className="player__locked">
            <h2>
              {accessError ===
              "This book requires a Premium subscription."
                ? "Premium Required"
                : "Unable to Play Book"}
            </h2>

            <p>{accessError}</p>

            {accessError ===
              "This book requires a Premium subscription." && (
              <button
                className="player__upgrade"
                onClick={() => navigate("/choose-plan")}
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <div className="player__container">
        <button
          className="player__back"
          onClick={() => navigate(`/book/${id}`)}
        >
          ← Back to Book
        </button>

        <div className="player__content">
          <div className="player__image">
            <img
              src={book.imageLink}
              alt={book.title}
            />
          </div>

          <div className="player__info">
            <h1>{book.title}</h1>

            <p className="player__author">
              {book.author}
            </p>

            {finished && (
              <div className="player__finished">
                Finished
              </div>
            )}

            <p className="player__description">
              {book.description}
            </p>

            <audio
              ref={audioRef}
              src={book.audioLink}
              preload="metadata"
            />

            <div className="player__controls">
              <button
                onClick={() => skipTime(-15)}
                className="player__skip"
              >
                -15
              </button>

              <button
                onClick={handlePlayPause}
                className="player__play"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={handleStop}
                className="player__stop"
              >
                Stop
              </button>

              <button
                onClick={() => skipTime(15)}
                className="player__skip"
              >
                +15
              </button>
            </div>

            <div className="player__progress">
              <span>
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
              />

              <span>
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;