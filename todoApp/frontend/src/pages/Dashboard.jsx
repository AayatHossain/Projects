import { useEffect, useState } from "react";
import { getTodos, createTodo, deleteTodo, updateTodo } from "../services/todoService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TodoList from "../components/TodoList";
import CreateTodo from "../components/CreateTodo";
import SearchBar from "../components/SearchBar";

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const query = search.trim().toLowerCase();
  const filteredTodos = query
    ? todos.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      )
    : todos;

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
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="ui-card flex justify-between items-center mb-8 p-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Todo App</h1>
            <p className="text-sm text-neutral-500">
              Logged in as {username}
            </p>
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="ui-btn ui-btn-outline"
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={handleLogout}
              className="ui-btn ui-btn-destructive"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Create Todo */}
          <div className="md:col-span-1 h-fit sticky top-6">
            <CreateTodo onAdd={handleAddTodo} />
          </div>

          {/* Right: Todo List */}
          <div className="md:col-span-2 max-h-[75vh] overflow-y-auto pr-1">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">My Todos</h2>
              <SearchBar value={search} onChange={setSearch} />
              {query && (
                <p className="mt-2 text-sm text-neutral-500">
                  {filteredTodos.length} result
                  {filteredTodos.length === 1 ? "" : "s"} for "{search.trim()}"
                </p>
              )}
            </div>

            <TodoList
              todos={filteredTodos}
              onDelete={handleDeleteTodo}
              onUpdate={handleUpdateTodo}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
