import { useEffect, useState } from "react";
import { getTodos, createTodo, deleteTodo, updateTodo } from "../services/todoService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TodoList from "../components/TodoList";
import CreateTodo from "../components/CreateTodo";

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUsername(decoded.sub);
      setIsAdmin(decoded.role === "admin");
    } catch {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        const data = await getTodos();
        setTodos(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [navigate]);

  const handleAddTodo = async (todo) => {
    try {
      const created = await createTodo(todo);
      setTodos((prev) => [created, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTodo = async (id, updatedData) => {
    try {
      const updated = await updateTodo(id, updatedData);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-shell min-h-screen overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
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

          @keyframes dashboardHeaderEnter {
            from {
              opacity: 0;
              transform: translateY(-16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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

          .dashboard-header {
            animation: dashboardHeaderEnter 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
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
            .dashboard-panel,
            .dashboard-header {
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

      {/* Header */}
      <div className="dashboard-header relative z-10 max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">My Todos</h1>
          <p className="text-sm text-indigo-100">
            Welcome, {username}
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="dashboard-action bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={handleLogout}
            className="dashboard-action bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left: Create Todo */}
        <div className="dashboard-panel md:col-span-1 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg h-fit sticky top-6">
          <CreateTodo onAdd={handleAddTodo} />
        </div>

        {/* Right: Todo List */}
        <div className="dashboard-panel md:col-span-2 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg max-h-[75vh] overflow-y-auto" style={{ animationDelay: "110ms" }}>
          <TodoList
            todos={todos}
            onDelete={handleDeleteTodo}
            onUpdate={handleUpdateTodo}
          />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
