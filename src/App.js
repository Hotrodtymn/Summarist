import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import Book from "./pages/Book";
import Player from "./pages/Player";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import ChoosePlan from "./pages/ChoosePlan.js";
import Search from "./pages/Search";

import Sidebar from "./components/Sidebar";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

import logo from "./assets/logo.png";

function HomeNavbar() {
  const { currentUser } = useAuth();

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

          {currentUser ? (
            <button
              type="button"
              className="navbar__button"
              onClick={handleLogout}
            >
              Log out
            </button>
          ) : (
            <Link to="/settings" className="navbar__button">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HomeNavbar />
                <Home />
              </>
            }
          />

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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;