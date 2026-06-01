import { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, []);

  const handleLogin = async () => {
    try {
      setError("");
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-100 p-6">

      <div className="ui-card w-full max-w-sm p-8">

        <h1 className="text-2xl font-semibold text-center mb-1 text-neutral-900">
          Welcome Back
        </h1>
        <p className="text-sm text-center text-neutral-500 mb-6">
          Login to your account
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <input
            className="ui-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="ui-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="ui-btn ui-btn-primary w-full"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/register")}
            className="ui-btn ui-btn-outline w-full"
          >
            Register
          </button>
        </div>

      </div>

    </div>
  );
}

export default Login;
