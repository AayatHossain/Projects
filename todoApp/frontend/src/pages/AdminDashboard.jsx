import { useEffect, useState } from "react";
import { getAllTodos, adminDeleteTodo } from "../services/todoService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TodoList from "../components/TodoList";

function AdminDashboard() {
  const [todos, setTodos] = useState([]);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // block non-admin
      if (decoded.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setUsername(decoded.sub);
    } catch {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        const data = await getAllTodos();
        setTodos(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [navigate]);

  const handleDeleteTodo = async (id) => {
    try {
      await adminDeleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">

      {/* Header */}
      <div className="ui-card max-w-6xl mx-auto flex justify-between items-center mb-8 p-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Admin Panel</h1>
          <p className="text-sm text-neutral-500">
            Logged in as {username}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/users")}
            className="ui-btn ui-btn-outline"
          >
            All Users
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="ui-btn ui-btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Centered Todo List */}
      <div className="max-w-4xl mx-auto max-h-[75vh] overflow-y-auto pr-1">
        <TodoList
          todos={todos}
          onDelete={handleDeleteTodo}
          isAdmin={true}
        />
      </div>

    </div>
  );
}

export default AdminDashboard;
