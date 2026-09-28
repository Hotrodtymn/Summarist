import { useState } from "react";

function AuthModal({ onClose }) {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="auth-modal__overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
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

        <button className="auth-modal__google">
          Continue with Google
        </button>

        <div className="auth-modal__divider">
          <span>or</span>
        </div>

        <input
          type="email"
          placeholder="Email"
          className="auth-modal__input"
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-modal__input"
        />

        <button className="auth-modal__submit">
          {isRegistering ? "Create account" : "Log in"}
        </button>

        <button
          className="auth-modal__switch"
          onClick={() => setIsRegistering(!isRegistering)}
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