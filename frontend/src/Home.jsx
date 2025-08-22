import AdminPanel from "./AdminPanel";

function Home({ userEmail, isAdmin, onLogout }) {
  return (
    <div className="auth-box">
      <h2>Velkommen, {userEmail}!</h2>
      {isAdmin ? (
        <>
          <p>Du er logget inn som <b>admin</b>.</p>
          <AdminPanel />
        </>
      ) : (
        <>
          <p>Du er logget inn som vanlig bruker.</p>
          {/* Her kan du vise brukerens bookinger, osv. */}
        </>
      )}
      <button className="submit-btn" onClick={onLogout}>
        Logg ut
      </button>
    </div>
  );
}

export default Home;