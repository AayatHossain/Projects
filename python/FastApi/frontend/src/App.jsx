import { useEffect, useState } from "react";
import { login } from "./services/authService";
import { getTodos } from "./services/todoService";

function App() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const run = async () => {
      await login("aayat", "aayat123");
      const data = await getTodos();
      setTodos(data);
    };

    run();
  }, []);

  return (
    <div>
      <h1>My Todos</h1>

      {todos.map((todo) => (
        <div key={todo.id}>
          <p>{todo.title}</p>
        </div>
      ))}
    </div>
  );
}

export default App;