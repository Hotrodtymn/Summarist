import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import logo from "./assets/logo.png";

import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import Book from "./pages/Book";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

function Navbar() {
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
          <Link to="/library">Library</Link>
          <Link to="/settings">My account</Link>
        </nav>

        {currentUser ? (
          <button
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
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/for-you" element={<ForYou />} />
            <Route path="/book/:id" element={<Book />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;