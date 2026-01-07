import { useEffect, useRef, useState } from 'react';
import { getKeycloak } from './keycloak';
import { hasKeycloakConfig } from './keycloak-config';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const apiUrl = (path) => {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${base}${path}`;
};

const DASHBOARD_PATH = '/dashboard';
const keyFor = (item) => `${item.user ?? 'anon'}-${item.book ?? 'untitled'}-${item.created_at ?? ''}`;

const authFetch = async (path, token, options = {}) => {
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json();
};

const initials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatRefreshTime = (value) => {
  if (!value) return 'Not refreshed yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
};

const App = () => {
  const canvasRef = useRef(null);
  const initAuthRef = useRef(false);
  const [authState, setAuthState] = useState({ loading: true, authenticated: false });
  const [profile, setProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [feed, setFeed] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState('');
  const [authView, setAuthView] = useState('signin');
  const [path, setPath] = useState(window.location.pathname);
  const [localToken, setLocalToken] = useState('');
  const [loginState, setLoginState] = useState({ loading: false, error: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupState, setSignupState] = useState({ loading: false, error: '', success: false });
  const [signupForm, setSignupForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
  });
  const [profileState, setProfileState] = useState({ loading: false, error: '', data: null });
  const [booklists, setBooklists] = useState([]);
  const [activeBooklistId, setActiveBooklistId] = useState('');
  const [booklistItems, setBooklistItems] = useState([]);
  const [booklistItemsState, setBooklistItemsState] = useState({ loading: false, error: '' });
  const [booklistActionState, setBooklistActionState] = useState({ loading: false, error: '' });
  const [booklistDeleteState, setBooklistDeleteState] = useState({ loading: false, error: '' });
  const [showBooklistForm, setShowBooklistForm] = useState(false);
  const [booklistForm, setBooklistForm] = useState({
    name: '',
    description: '',
    visibility: 'public',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState(() => new Set());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawMandelbrot = () => {
      const width = Math.floor(window.innerWidth);
      const height = Math.floor(window.innerHeight);
      const scale = 0.6;
      const renderWidth = Math.max(320, Math.floor(width * scale));
      const renderHeight = Math.max(240, Math.floor(height * scale));

      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const image = ctx.createImageData(renderWidth, renderHeight);
      const maxIter = 80;
      const zoom = 1.35;
      const centerX = -0.6;
      const centerY = 0.0;
      const aspect = renderWidth / renderHeight;

      for (let y = 0; y < renderHeight; y += 1) {
        for (let x = 0; x < renderWidth; x += 1) {
          const cx = (x / renderWidth - 0.5) * 3.2 * zoom * aspect + centerX;
          const cy = (y / renderHeight - 0.5) * 3.2 * zoom + centerY;
          let zx = 0;
          let zy = 0;
          let iter = 0;
          while (zx * zx + zy * zy <= 4 && iter < maxIter) {
            const xt = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = xt;
            iter += 1;
          }

          const idx = (y * renderWidth + x) * 4;
          if (iter === maxIter) {
            image.data[idx] = 10;
            image.data[idx + 1] = 6;
            image.data[idx + 2] = 16;
            image.data[idx + 3] = 255;
          } else {
            const t = iter / maxIter;
            const r = Math.floor(24 + 230 * Math.pow(t, 0.6));
            const g = Math.floor(18 + 120 * Math.pow(t, 1.4));
            const b = Math.floor(60 + 200 * Math.pow(t, 0.8));
            image.data[idx] = r;
            image.data[idx + 1] = g;
            image.data[idx + 2] = b;
            image.data[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(image, 0, 0);
    };

    const handleResize = () => {
      drawMandelbrot();
    };

    drawMandelbrot();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    if (path !== '/') return;
    window.history.replaceState({}, '', DASHBOARD_PATH);
    setPath(DASHBOARD_PATH);
  }, [path]);

  const navigate = (nextPath) => {
    if (nextPath === path) return;
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  };

  const getActiveToken = () => localToken || getKeycloak().token;
  const profileMatch = path.match(/^\/profile\/([^/]+)$/);
  const profileUsername = profileMatch ? decodeURIComponent(profileMatch[1]) : '';

  useEffect(() => {
    if (!hasKeycloakConfig()) {
      setAuthError(
        'Missing Keycloak configuration. Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID.',
      );
      setAuthState({ loading: false, authenticated: false });
      return;
    }

    if (initAuthRef.current) {
      return;
    }
    initAuthRef.current = true;

    const keycloak = getKeycloak();

    keycloak
      .init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        setAuthState({ loading: false, authenticated });
        if (!authenticated) return;

        keycloak
          .loadUserProfile()
          .then((profileData) => {
            setProfile(profileData);
            const username = profileData?.username || profileData?.preferred_username;
            if (username && window.location.pathname === '/') {
              navigate(DASHBOARD_PATH);
            }
          })
          .catch(() => {
            setAuthError('Unable to load user profile.');
          });

        loadFeed(keycloak.token);
      })
      .catch((err) => {
        console.error('Keycloak initialization error:', err);
        setAuthError('Failed to initialize authentication.');
        setAuthState({ loading: false, authenticated: false });
      });

    const refreshInterval = setInterval(() => {
      if (!keycloak.authenticated) return;
      keycloak
        .updateToken(70)
        .catch(() => {
          setAuthError('Session expired. Please log in again.');
        });
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!profileUsername) return;
    fetchProfile(profileUsername);
    fetchBooklists(profileUsername);
  }, [profileUsername, localToken]);

  useEffect(() => {
    if (!profile?.username && !profile?.preferred_username) return;
    fetchBooklists(profile?.username || profile?.preferred_username);
  }, [profile?.username, profile?.preferred_username, localToken]);

  useEffect(() => {
    if (!booklists.length) {
      setActiveBooklistId('');
      setBooklistItems([]);
      return;
    }
    if (!activeBooklistId || !booklists.some((list) => list._id === activeBooklistId)) {
      setActiveBooklistId(booklists[0]._id);
    }
  }, [booklists, activeBooklistId]);

  useEffect(() => {
    if (!activeBooklistId) return;
    setBooklistActionState({ loading: false, error: '' });
    fetchBooklistItems(activeBooklistId);
  }, [activeBooklistId]);

  const loadFeed = async (tokenOverride) => {
    try {
      const keycloak = getKeycloak();
      const token = tokenOverride || localToken || keycloak.token;
      if (!token) {
        throw new Error('Missing access token');
      }
      if (keycloak.authenticated && !tokenOverride) {
        await keycloak.updateToken(70);
      }
      const feedRes = await authFetch('/feed', token);
      setFeed(feedRes?.feed ?? []);
      setLastRefreshed(feedRes?.lastRefreshed || new Date().toISOString());
      setAuthError('');
    } catch (err) {
      console.error('Failed to load data', err);
      setAuthError(err.message || 'Failed to load feed.');
    }
  };

  const handleFindBooks = () => {
    setSearchQuery('');
    loadFeed();
  };

  const toggleExpandedItem = (key) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getBookDescription = (item) => {
    const user = item.user || 'A reader';
    const status = item.status || 'reviewed';
    const ratingText =
      typeof item.rating === 'number' ? `${item.rating.toFixed(1)}★` : 'no rating yet';
    return `${item.book} was ${status} by ${user} with ${ratingText}.`;
  };

  const handleLogin = () => {
    const keycloak = getKeycloak();
    keycloak.login({
      idpHint: 'github',
      redirectUri: window.location.href,
    });
  };

  const handleKeycloakLogin = () => {
    const keycloak = getKeycloak();
    keycloak.login({ redirectUri: window.location.href });
  };

  const handleLogout = () => {
    getKeycloak().logout();
    setLocalToken('');
    setProfile(null);
    setAuthState({ loading: false, authenticated: false });
    navigate(DASHBOARD_PATH);
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setLoginState({ loading: true, error: '' });
    try {
      const response = await fetch(apiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Login failed: ${response.status}`);
      }
      const data = await response.json();
      if (!data?.access_token) {
        throw new Error('Missing access token');
      }
      setLocalToken(data.access_token);
      setProfile({ username: loginForm.username });
      setAuthState({ loading: false, authenticated: true });
      setLoginState({ loading: false, error: '' });
      navigate(DASHBOARD_PATH);
      loadFeed(data.access_token);
    } catch (err) {
      setLoginState({ loading: false, error: err.message || 'Login failed.' });
    }
  };

  const handleBooklistChange = (event) => {
    const { name, value } = event.target;
    setBooklistForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBooklist = async (event) => {
    event.preventDefault();
    const token = getActiveToken();
    if (!token) {
      setAuthError('Sign in to create a booklist.');
      return;
    }
    try {
      await authFetch('/booklists', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booklistForm),
      });
      setBooklistForm({ name: '', description: '', visibility: 'public' });
      const owner = profile?.username || profileState.data?.username;
      if (owner) {
        fetchBooklists(owner);
      }
      setShowBooklistForm(false);
    } catch (err) {
      setAuthError(err.message || 'Failed to create booklist.');
    }
  };

  const fetchProfile = async (username) => {
    setProfileState({ loading: true, error: '', data: null });
    try {
      const token = getActiveToken();
      const response = await fetch(apiUrl(`/profile/${username}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Profile request failed: ${response.status}`);
      }
      const data = await response.json();
      setProfileState({ loading: false, error: '', data });
    } catch (err) {
      setProfileState({ loading: false, error: err.message || 'Failed to load profile.', data: null });
    }
  };

  const fetchBooklists = async (username) => {
    try {
      const response = await fetch(apiUrl(`/booklists/${username}`));
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Booklists request failed: ${response.status}`);
      }
      const data = await response.json();
      setBooklists(Array.isArray(data?.booklists) ? data.booklists : []);
    } catch (err) {
      setBooklists([]);
    }
  };

  const fetchBooklistItems = async (booklistId) => {
    setBooklistItemsState({ loading: true, error: '' });
    try {
      const response = await fetch(apiUrl(`/booklists/${booklistId}/items`));
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Booklist items request failed: ${response.status}`);
      }
      const data = await response.json();
      setBooklistItems(Array.isArray(data?.items) ? data.items : []);
      setBooklistItemsState({ loading: false, error: '' });
    } catch (err) {
      setBooklistItems([]);
      setBooklistItemsState({
        loading: false,
        error: err.message || 'Unable to load booklist items.',
      });
    }
  };

  const handleAddToBooklist = async (bookTitle) => {
    if (!activeBooklistId) {
      setBooklistActionState({ loading: false, error: 'Select a list first.' });
      return;
    }
    const token = getActiveToken();
    if (!token) {
      setBooklistActionState({ loading: false, error: 'Sign in to update your lists.' });
      return;
    }
    setBooklistActionState({ loading: true, error: '' });
    try {
      await authFetch(`/booklists/${activeBooklistId}/items`, token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: bookTitle }),
      });
      fetchBooklistItems(activeBooklistId);
      const owner = profile?.username || profileState.data?.username;
      if (owner) {
        fetchBooklists(owner);
      }
      setBooklistActionState({ loading: false, error: '' });
    } catch (err) {
      setBooklistActionState({
        loading: false,
        error: err.message || 'Unable to add book to list.',
      });
    }
  };

  const handleDeleteBooklist = async (booklistId) => {
    const token = getActiveToken();
    if (!token) {
      setBooklistDeleteState({ loading: false, error: 'Sign in to delete booklists.' });
      return;
    }
    if (!window.confirm('Delete this booklist? This cannot be undone.')) {
      return;
    }
    setBooklistDeleteState({ loading: true, error: '' });
    try {
      await authFetch(`/booklists/${booklistId}`, token, { method: 'DELETE' });
      setBooklists((prev) => prev.filter((list) => list._id !== booklistId));
      if (activeBooklistId === booklistId) {
        setActiveBooklistId('');
        setBooklistItems([]);
      }
      setBooklistDeleteState({ loading: false, error: '' });
    } catch (err) {
      setBooklistDeleteState({
        loading: false,
        error: err.message || 'Unable to delete booklist.',
      });
    }
  };

  const formatAddedAt = (value) => {
    if (!value) return 'Unknown';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Unknown';
    return parsed.toLocaleDateString();
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupState({ loading: true, error: '', success: false });
    try {
      const response = await fetch(apiUrl('/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Signup failed: ${response.status}`);
      }
      setSignupState({ loading: false, error: '', success: true });
      setAuthView('signin');
    } catch (err) {
      setSignupState({ loading: false, error: err.message || 'Signup failed.', success: false });
    }
  };

  const handleImageError = (badKey) => {
    setFeed((prev) =>
      prev.map((item) => (keyFor(item) === badKey ? { ...item, coverUrl: null } : item)),
    );
  };

  const displayName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
      : profile?.username || 'Reader';
  const statusLabel = authState.authenticated ? 'Online' : 'Signed out';
  const hasConfig = hasKeycloakConfig();
  const isProfileView = Boolean(profileUsername);
  const activeBooklist = booklists.find((list) => list._id === activeBooklistId);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFeed = normalizedQuery
    ? feed.filter((item) => {
        const book = item.book?.toLowerCase() || '';
        const user = item.user?.toLowerCase() || '';
        const status = item.status?.toLowerCase() || '';
        return book.includes(normalizedQuery) || user.includes(normalizedQuery) || status.includes(normalizedQuery);
      })
    : feed;

  return (
    <>
      <canvas ref={canvasRef} className="mandelbrot-bg" aria-hidden="true" />
      <header className="topbar">
        <div className="brand">
          <span className="logo-book" aria-hidden="true" />
          <span className="wordmark">Socialbook</span>
        </div>
        <div className="nav">
          <span className={`badge ${authState.authenticated ? 'success' : ''}`}>{statusLabel}</span>
          {authState.authenticated && (
            <>
              <span className="meta">{displayName}</span>
              <button className="ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {authState.loading ? (
        <main className="auth-shell">
          <section className="auth-hero">
            <div className="hero-copy">
              <p className="label">Authenticating</p>
              <h1>Syncing your Socialbook</h1>
              <p className="lede">Waiting for Keycloak to finish the handshake.</p>
            </div>
          </section>
        </main>
      ) : !authState.authenticated ? (
        <main className="auth-shell">
          {authView === 'signup' ? (
            <section className="auth-hero">
              <div className="hero-copy">
                <p className="label">Create account</p>
                <h1>Join Socialbook</h1>
                <p className="lede">Tell us a bit about you to get started.</p>
                <div className="actions">
                  <button className="ghost" type="button" onClick={() => setAuthView('signin')}>
                    Back to sign in
                  </button>
                </div>
              </div>
              <div className="panel shadow">
                <p className="label">New profile</p>
                <h3>Create your account</h3>
                <p className="meta">Your credentials are stored in Keycloak.</p>
                <form className="form vertical" onSubmit={handleSignupSubmit}>
                  <label className="field">
                    <span className="meta">First name</span>
                    <input
                      name="firstName"
                      value={signupForm.firstName}
                      onChange={handleSignupChange}
                      autoComplete="given-name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="meta">Last name</span>
                    <input
                      name="lastName"
                      value={signupForm.lastName}
                      onChange={handleSignupChange}
                      autoComplete="family-name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="meta">Age</span>
                    <input
                      name="age"
                      type="number"
                      min="13"
                      value={signupForm.age}
                      onChange={handleSignupChange}
                      autoComplete="bday-year"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="meta">Username</span>
                    <input
                      name="username"
                      value={signupForm.username}
                      onChange={handleSignupChange}
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="meta">Password</span>
                    <input
                      name="password"
                      type="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  {signupState.error && <p className="empty-state">{signupState.error}</p>}
                  {signupState.success && (
                    <p className="empty-state">Account created. Sign in to continue.</p>
                  )}
                  <button className="primary" type="submit" disabled={signupState.loading}>
                    {signupState.loading ? 'Creating...' : 'Create account'}
                  </button>
                </form>
              </div>
            </section>
          ) : (
            <section className="auth-hero">
              <div className="hero-copy">
                <p className="label">Sign in required</p>
              <h1>Welcome back to Socialbook</h1>
              <p className="lede">Log in to see your personalized reading feed.</p>
                {authError && <p className="empty-state">{authError}</p>}
                <div className="actions">
                  {hasConfig && (
                    <>
                      <button className="cta" type="button" onClick={handleLogin}>
                        Continue with GitHub
                      </button>
                      <button className="primary" type="button" onClick={() => setAuthView('signup')}>
                        Create account
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="panel shadow">
                <p className="label">Sign in</p>
                <h3>Username & password</h3>
                <p className="meta">Sign in with your username and password.</p>
                <form className="form vertical" onSubmit={handlePasswordLogin}>
                  <label className="field">
                    <span className="meta">Username</span>
                    <input
                      name="username"
                      value={loginForm.username}
                      onChange={handleLoginChange}
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="meta">Password</span>
                    <input
                      name="password"
                      type="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  {loginState.error && <p className="empty-state">{loginState.error}</p>}
                  <button className="primary" type="submit" disabled={loginState.loading}>
                    {loginState.loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              </div>
            </section>
          )}
        </main>
      ) : (
        <main className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="brand">
                <span className="logo-book" aria-hidden="true" />
                <span className="wordmark">Socialbook</span>
              </div>
              <span className="sidebar-meta">{statusLabel}</span>
            </div>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-link${!isProfileView ? ' active' : ''}`}
                type="button"
                onClick={() => navigate(DASHBOARD_PATH)}
              >
                Dashboard
              </button>
              <button
                className={`sidebar-link${isProfileView ? ' active' : ''}`}
                type="button"
                onClick={() => navigate(`/profile/${profile?.username || profileUsername || ''}`)}
                disabled={!profile?.username && !profileUsername}
              >
                Profile
              </button>
            </nav>
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Your Library</span>
                <button className="ghost small" type="button" onClick={() => setShowBooklistForm(true)}>
                  New list
                </button>
              </div>
              {booklists.length === 0 ? (
                <p className="empty-state">No booklists yet.</p>
              ) : (
                <ul className="library-list">
                  {booklists.map((list) => (
                    <li key={list._id} className="library-row">
                      <button
                        className={`library-link${activeBooklistId === list._id ? ' active' : ''}`}
                        type="button"
                        onClick={() => setActiveBooklistId(list._id)}
                      >
                        <span>{list.name}</span>
                        <span className="meta">{list.totalItems ?? 0}</span>
                      </button>
                      {list.ownerId === (profile?.username || profileState.data?.username) && (
                        <button
                          className="ghost small danger"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteBooklist(list._id);
                          }}
                          disabled={booklistDeleteState.loading}
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="sidebar-footer">
              <span className="meta">{profile?.email}</span>
              <button className="ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </aside>
          <section className="content">
            <header className="content-header">
              <div>
                <p className="label">{isProfileView ? 'Profile' : 'Dashboard'}</p>
                <h2>{isProfileView ? profileUsername : `Welcome back, ${displayName}`}</h2>
                {!isProfileView && (
                  <p className="meta">Last refreshed {formatRefreshTime(lastRefreshed)}</p>
                )}
              </div>
              <div className="content-actions">
                <label className="field search-field">
                  <span className="meta">Search</span>
                  <input
                    type="search"
                    placeholder="Search books or readers"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    aria-label="Search books"
                  />
                </label>
                <button className="primary" type="button" onClick={handleFindBooks}>
                  Find books
                </button>
              </div>
            </header>

            {isProfileView ? (
              <section className="panel stack">
                <header className="panel-header">
                  <div>
                    <p className="label">Profile</p>
                    <h3>{profileState.data?.username || profileUsername}</h3>
                  </div>
                  <div className="meta">{profileState.data?.email}</div>
                </header>
                {profileState.loading ? (
                  <p className="empty-state">Loading profile…</p>
                ) : profileState.error ? (
                  <p className="empty-state">{profileState.error}</p>
                ) : (
                  <>
                    <p className="meta">
                      {profileState.data?.firstName} {profileState.data?.lastName}
                    </p>
                    <div className="pill-row">
                      <span className="pill">{booklists.length} public lists</span>
                      <span className="pill">Followers: 0</span>
                      <span className="pill">Following: 0</span>
                    </div>
                  </>
                )}
              </section>
            ) : (
              <>
                <section className="hero-card">
                  <div>
                    <p className="label">For you</p>
                    <h3>Your listening queue, but for books.</h3>
                    <p className="meta">
                      Curate stacks, drop in your recent reads, and keep the feed rolling.
                    </p>
                    <div className="actions">
                      <button className="cta" type="button" onClick={() => setShowBooklistForm(true)}>
                        Create a booklist
                      </button>
                      <button className="ghost" type="button" onClick={() => navigate(`/profile/${profile?.username || ''}`)}>
                        View profile
                      </button>
                    </div>
                  </div>
                  <div className="hero-metrics">
                    <div>
                      <p className="label">Booklists</p>
                      <h4>{booklists.length}</h4>
                      <p className="meta">Curated collections</p>
                    </div>
                    <div>
                      <p className="label">Feed items</p>
                      <h4>{feed.length}</h4>
                      <p className="meta">Fresh activity</p>
                    </div>
                    <div>
                      <p className="label">Active list</p>
                      <h4>{activeBooklist?.name || 'None yet'}</h4>
                      <p className="meta">{activeBooklist?.visibility || 'Create one'}</p>
                    </div>
                  </div>
                </section>

                {showBooklistForm && (
                  <section className="panel stack">
                    <header className="panel-header">
                      <div>
                        <p className="label">New list</p>
                        <h3>Create a booklist</h3>
                      </div>
                      <button className="ghost" type="button" onClick={() => setShowBooklistForm(false)}>
                        Close
                      </button>
                    </header>
                    <form className="form" onSubmit={handleCreateBooklist}>
                      <label className="field">
                        <span className="meta">Name</span>
                        <input
                          name="name"
                          value={booklistForm.name}
                          onChange={handleBooklistChange}
                          required
                        />
                      </label>
                      <label className="field">
                        <span className="meta">Description</span>
                        <input
                          name="description"
                          value={booklistForm.description}
                          onChange={handleBooklistChange}
                        />
                      </label>
                      <label className="field">
                        <span className="meta">Visibility</span>
                        <select
                          name="visibility"
                          value={booklistForm.visibility}
                          onChange={handleBooklistChange}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="unlisted">Unlisted</option>
                        </select>
                      </label>
                      <button className="primary" type="submit">
                        Create booklist
                      </button>
                    </form>
                  </section>
                )}

                <section className="panel stack">
                  <header className="panel-header">
                    <div>
                      <p className="label">Your stacks</p>
                      <h3>{activeBooklist?.name || 'Select a list'}</h3>
                    </div>
                    <div className="panel-actions">
                      <span className="meta">{activeBooklist?.visibility || '—'}</span>
                      {activeBooklist && (
                        <button
                          className="ghost small danger"
                          type="button"
                          onClick={() => handleDeleteBooklist(activeBooklist._id)}
                          disabled={booklistDeleteState.loading}
                        >
                          Delete list
                        </button>
                      )}
                    </div>
                  </header>
                  {booklistItemsState.loading ? (
                    <p className="empty-state">Loading booklist items…</p>
                  ) : booklistItemsState.error ? (
                    <p className="empty-state">{booklistItemsState.error}</p>
                  ) : booklistItems.length === 0 ? (
                    <p className="empty-state">No items yet. Add a book from the feed.</p>
                  ) : (
                    <ul className="queue-list">
                      {booklistItems.map((item) => (
                        <li key={item._id}>
                          <div>
                            <p className="title">{item.bookId}</p>
                            <p className="meta">{item.notes || 'No notes yet'}</p>
                          </div>
                          <span className="meta">{formatAddedAt(item.addedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {booklistActionState.error && (
                    <p className="empty-state">{booklistActionState.error}</p>
                  )}
                  {booklistDeleteState.error && (
                    <p className="empty-state">{booklistDeleteState.error}</p>
                  )}
                </section>

                <section className="panel stack">
                  <header className="panel-header">
                    <div>
                      <p className="label">Latest feed</p>
                      <h3>Fresh book activity</h3>
                    </div>
                  </header>
                  {authError && <p className="empty-state">{authError}</p>}
                  {feed.length === 0 ? (
                    <p className="empty-state">No reviews yet.</p>
                  ) : filteredFeed.length === 0 ? (
                    <p className="empty-state">No matches. Clear the search to see all books.</p>
                  ) : (
                    <ul className="feed-list books-list feed-list-clickable">
                      {filteredFeed.map((item) => {
                        const itemKey = keyFor(item);
                        const isExpanded = expandedItems.has(itemKey);
                        const description = getBookDescription(item);
                        return (
                          <li
                            key={itemKey}
                            className={`feed-item${isExpanded ? ' expanded' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpandedItem(itemKey)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleExpandedItem(itemKey);
                              }
                            }}
                          >
                            {item.coverUrl ? (
                              <div className="cover-thumb" aria-hidden="true">
                                <img
                                  src={item.coverUrl}
                                  alt={item.book}
                                  loading="lazy"
                                  onError={() => handleImageError(itemKey)}
                                />
                              </div>
                            ) : (
                              <div className="avatar" aria-hidden="true">
                                {initials(item.user)}
                              </div>
                            )}
                            <div>
                              <p className="title">
                                <strong>{item.book}</strong>
                              </p>
                              <div className="tags">
                                {item.user && <span className="tag">{item.user}</span>}
                                {item.status && <span className="tag muted">{item.status}</span>}
                                {item.rating && <span className="tag muted">{item.rating.toFixed(1)}★</span>}
                              </div>
                              <div className="book-details">
                                <div>
                                  <p className="detail-label">Summary</p>
                                  <p className="detail-text">{description}</p>
                                </div>
                                {item.review && (
                                  <div>
                                    <p className="detail-label">Review</p>
                                    <p className="detail-text">{item.review}</p>
                                  </div>
                                )}
                                <button
                                  className="ghost small"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleAddToBooklist(item.book);
                                  }}
                                  disabled={booklistActionState.loading}
                                >
                                  Add to {activeBooklist?.name || 'list'}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </>
            )}
          </section>
        </main>
      )}
    </>
  );
};

export default App;
