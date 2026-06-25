export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post" style={{ margin: 0 }}>
      <button className="btn secondary" type="submit">Sign out</button>
    </form>
  );
}
