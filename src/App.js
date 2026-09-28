import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import ForYou from "./pages/ForYou";
import Book from "./pages/Book";
import Player from "./pages/Player";

import Sidebar from "./components/Sidebar";

import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="*"
              element={
                <div className="app-layout">
                  <Sidebar />

                  <main className="app-content">
                    <Routes>
                      <Route path="/for-you" element={<ForYou />} />
                      <Route path="/book/:id" element={<Book />} />
                      <Route path="/player/:id" element={<Player />} />
                    </Routes>
                  </main>
                </div>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;