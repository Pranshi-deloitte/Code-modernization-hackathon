import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AlbumsPage from './components/AlbumsPage';
import ErrorsPage from './components/ErrorsPage';

// Replaces AngularJS $routeProvider in app.js:
//   /errors → ErrorsController + errors.html
//   *       → AlbumsController + albums.html
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <div className="container" style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/errors" element={<ErrorsPage />} />
          <Route path="*" element={<AlbumsPage />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}
