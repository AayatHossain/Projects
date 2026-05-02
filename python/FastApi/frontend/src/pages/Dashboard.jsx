import { useEffect, useState } from "react";
import { getTodos } from "../services/todoService";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const navigate = useNavigate();

  // 🔐 Auth check + fetch todos
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
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
  }, []);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* 🔝 Header */}
      <div className="max-w-xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Todos</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* 📋 Todo List */}
      <div className="max-w-xl mx-auto space-y-3">

        {todos.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
            No todos yet
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
            >
              <span className="text-gray-800">{todo.title}</span>

              {/* optional status */}
              {todo.completed && (
                <span className="text-green-500 text-sm">Done</span>
              )}
            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default Dashboard;