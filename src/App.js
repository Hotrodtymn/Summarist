import { useEffect, useState } from "react";
import "./App.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import { signOut } from "firebase/auth";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import Book from "./pages/Book";
import Player from "./pages/Player";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import ChoosePlan from "./pages/ChoosePlan";
import Search from "./pages/Search";
import Highlights from "./pages/Highlights";
import Help from "./pages/Help";

import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import { auth } from "./firebase";
import logo from "./assets/logo.png";

function HomeNavbar({ onOpenAuth }) {
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__logo">
          <img src={logo} alt="Summarist" />
        </Link>

        <nav className="navbar__links">
          <Link to="/for-you">For you</Link>

          {isAuthenticated ? (
            <button
              type="button"
              className="navbar__button"
              onClick={handleLogout}
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              className="navbar__button"
              onClick={onOpenAuth}
            >
              Log in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppContent() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener(
      "open-auth-modal",
      handleOpenAuthModal
    );

    return () => {
      window.removeEventListener(
        "open-auth-modal",
        handleOpenAuthModal
      );
    };
  }, []);

  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <>
      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <>
              <HomeNavbar onOpenAuth={openAuthModal} />
              <Home />
              <Footer />
            </>
          }
        />

        {/* FOR YOU */}
        <Route
          path="/for-you"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <ForYou />
              </main>
            </div>
          }
        />

        {/* SEARCH */}
        <Route
          path="/search"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Search />
              </main>
            </div>
          }
        />

        {/* LIBRARY */}
        <Route
          path="/library"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Library />
              </main>
            </div>
          }
        />

        {/* BOOK */}
        <Route
          path="/book/:id"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Book />
              </main>
            </div>
          }
        />

        {/* PLAYER */}
        <Route
          path="/player/:id"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Player />
              </main>
            </div>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Settings />
              </main>
            </div>
          }
        />

        {/* CHOOSE PLAN */}
        <Route
          path="/choose-plan"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <ChoosePlan />
              </main>
            </div>
          }
        />

        {/* HIGHLIGHTS */}
        <Route
          path="/highlights"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Highlights />
              </main>
            </div>
          }
        />

        {/* HELP */}
        <Route
          path="/help"
          element={
            <div className="app-layout">
              <Sidebar />

              <main className="app-content">
                <Help />
              </main>
            </div>
          }
        />
      </Routes>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <AuthModal onClose={closeAuthModal} />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;