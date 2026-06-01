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
    <div className="dashboard-shell min-h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex items-center justify-center">
      <style>
        {`
          @keyframes dashboardBackground {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes dashboardGrid {
            0% { transform: translate3d(0, 0, 0); opacity: 0.22; }
            50% { opacity: 0.34; }
            100% { transform: translate3d(32px, 32px, 0); opacity: 0.22; }
          }

          @keyframes dashboardEnter {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.985);
              filter: blur(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          .dashboard-shell {
            position: relative;
            background-size: 220% 220%;
            animation: dashboardBackground 18s ease-in-out infinite;
          }

          .dashboard-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px);
            background-size: 32px 32px;
            mask-image: linear-gradient(to bottom, rgba(0,0,0,0.65), transparent 78%);
            animation: dashboardGrid 16s linear infinite;
          }

          .dashboard-panel {
            animation: dashboardEnter 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
            transition: transform 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
            will-change: transform;
          }

          .dashboard-panel:hover {
            transform: translateY(-3px);
            box-shadow: 0 24px 60px rgba(31, 41, 55, 0.22);
            background-color: rgba(255, 255, 255, 0.24);
          }

          .dashboard-action {
            transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
          }

          .dashboard-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(31, 41, 55, 0.2);
          }

          .dashboard-action:active {
            transform: translateY(0) scale(0.98);
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-shell,
            .dashboard-shell::before,
            .dashboard-panel {
              animation: none;
            }

            .dashboard-panel,
            .dashboard-panel:hover,
            .dashboard-action,
            .dashboard-action:hover,
            .dashboard-action:active {
              transform: none;
              transition: none;
            }
          }
        `}
      </style>

      {/* Registration Panel */}
      <div className="dashboard-panel relative z-10 w-full max-w-md bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-indigo-100">Register to start managing your todos</p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-100 bg-red-500/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 text-sm text-green-50 bg-green-500/40 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <div className="space-y-4">
          <input
            className="w-full p-3 border border-transparent rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="email"
            className="w-full p-3 border border-transparent rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full p-3 border border-transparent rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="w-full p-3 border border-transparent rounded-lg bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <button
            onClick={handleRegister}
            className="dashboard-action w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg"
          >
            Register
          </button>

          <button
            onClick={() => navigate("/")}
            className="dashboard-action w-full bg-white/30 hover:bg-white/40 text-white p-3 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Registration;