
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase";

function AuthModal({ onClose }) {
  const [isRegistering, setIsRegistering] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }

      onClose();
    } catch (error) {
      console.error(
        "Authentication failed:",
        error.code,
        error.message
      );

      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setIsSubmitting(true);

    try {
      const provider =
        new GoogleAuthProvider();

      await signInWithPopup(
        auth,
        provider
      );

      onClose();
    } catch (error) {
      console.error(
        "Google authentication failed:",
        error.code,
        error.message
      );

      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setError("");
    setIsSubmitting(true);

    try {
      await signInAnonymously(auth);

      onClose();
    } catch (error) {
      console.error(
        "Guest authentication failed:",
        error.code,
        error.message
      );

      setError(
        "Unable to continue as a guest. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleAuthMode() {
    setIsRegistering(
      !isRegistering
    );
    setError("");
  }

  return (
    <div
      className="auth-modal__overlay"
      onClick={onClose}
    >
      <div
        className="auth-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="auth-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2>
          {isRegistering
            ? "Create your account"
            : "Welcome back"}
        </h2>

        <p className="auth-modal__description">
          {isRegistering
            ? "Create an account to start learning."
            : "Log in to continue learning."}
        </p>

        <button
          type="button"
          className="auth-modal__google"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Please wait..."
            : "Continue with Google"}
        </button>

        <div className="auth-modal__divider">
          <span>or</span>
        </div>

        <input
          type="email"
          placeholder="Email"
          aria-label="Email"
          className="auth-modal__input"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          disabled={isSubmitting}
        />

        <input
          type="password"
          placeholder="Password"
          aria-label="Password"
          className="auth-modal__input"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          disabled={isSubmitting}
        />

        {error && (
          <p
            className="auth-modal__error"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          className="auth-modal__submit"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !email.trim() ||
            !password
          }
        >
          {isSubmitting
            ? "Please wait..."
            : isRegistering
              ? "Create account"
              : "Log in"}
        </button>

        {!isRegistering && (
          <button
            type="button"
            className="auth-modal__guest"
            onClick={handleGuestLogin}
            disabled={isSubmitting}
          >
            Continue as Guest
          </button>
        )}

        <button
          type="button"
          className="auth-modal__switch"
          onClick={toggleAuthMode}
          disabled={isSubmitting}
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}

export default AuthModal;