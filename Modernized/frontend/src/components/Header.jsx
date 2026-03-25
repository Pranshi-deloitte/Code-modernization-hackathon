import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAppInfo } from '../api/albums';

// Replaces InfoController + header.html
// Green navbar, Spring Music brand, info dropdown showing profiles + services
export default function Header() {
  const [info, setInfo] = useState({ profiles: [], services: [] });

  useEffect(() => {
    getAppInfo().then(setInfo).catch(() => {});
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          ♫ Spring Music
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                ⚙ {info.profiles.join(', ') || 'default'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text text-muted small">
                    <strong>Profiles:</strong> {info.profiles.join(', ') || '(none)'}
                  </span>
                </li>
                <li>
                  <span className="dropdown-item-text text-muted small">
                    <strong>Services:</strong> {info.services.join(', ') || '(none)'}
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" to="/errors">
                    Force Errors
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
