import TodoItem from "./TodoItem";

function TodoList({ todos }) {
  if (todos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
        No todos found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

export default TodoList;