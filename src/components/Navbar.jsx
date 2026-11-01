import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const LOGO = 'https://play-lh.googleusercontent.com/dt2vwtgxqAf8FiuiapBZLRQ1WcPXYsT9Og-AayX7I0OT-wvogRyiciUe7_o1Ur3O_nXqPGsOVELlHlooZxKD';

export default function Navbar() {
  const nav = useNavigate();
  return (
    <nav className="navbar app-nav px-3 py-2">
      <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-semibold mb-0">
        <img src={LOGO} alt="CodeTantra" width="36" height="36" style={{ borderRadius: 8, objectFit: 'contain' }}
          onError={e => { e.currentTarget.style.display = 'none'; }} />
        CodeTantra Bills
      </Link>
      <button className="btn btn-sm btn-light border d-flex align-items-center gap-1 text-dark" onClick={() => { localStorage.removeItem('token'); nav('/login'); }}><FiLogOut /> Logout</button>
    </nav>
  );
}