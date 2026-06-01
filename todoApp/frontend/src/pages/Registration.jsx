import { useState } from "react";
import { registerUser } from "../services/registration";
import { useNavigate } from "react-router-dom";

function Registration() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setError("");
      setSuccess("");
      await registerUser({
        username,
        email,
        password,
        phone_number: phoneNumber,
      });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6 flex items-center justify-center">

      {/* Registration Panel */}
      <div className="ui-card w-full max-w-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Create Account</h1>
          <p className="text-sm text-neutral-500">Register to start managing your todos</p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-700 bg-red-50 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
            {success}
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
            type="email"
            className="ui-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="ui-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="ui-input"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <button
            onClick={handleRegister}
            className="ui-btn ui-btn-primary w-full"
          >
            Register
          </button>

          <button
            onClick={() => navigate("/")}
            className="ui-btn ui-btn-outline w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;
