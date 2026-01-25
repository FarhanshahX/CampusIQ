import { useAuth } from "../auth/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <>
      <h1>Welcome, {user.name}</h1>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </>
  );
};

export default Dashboard;
