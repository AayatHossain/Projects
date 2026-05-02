import { useEffect, useState } from "react";
import { getTodos, createTodo } from "../services/todoService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TodoList from "../components/TodoList";
import CreateTodo from "../components/CreateTodo";

function Dashboard() {
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
      setUsername(decoded.sub);
    } catch {
      navigate("/");
      return;
    }

    const load = async () => {
      const data = await getTodos();
      setTodos(data);
    };

    load();
  }, []);

 
  const handleAddTodo = async (todo) => {
  try {
    const created = await createTodo(todo);
    setTodos((prev) => [created, ...prev]);
  } catch (err) {
    throw err;
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
          <p className="text-sm text-gray-500">
            Welcome, {username}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      
      <div className="max-w-2xl mx-auto">
        <CreateTodo onAdd={handleAddTodo} />
      </div>

      
      <div className="max-w-2xl mx-auto mt-4">
        <TodoList todos={todos} />
      </div>

    </div>
  );
}

export default Dashboard;