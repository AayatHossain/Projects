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

      // 🔐 block non-admin
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-indigo-100">
            Logged in as {username}
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Centered Todo List */}
      <div className="max-w-4xl mx-auto bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg max-h-[75vh] overflow-y-auto">
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