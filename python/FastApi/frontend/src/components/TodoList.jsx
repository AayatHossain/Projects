import TodoItem from "./TodoItem";

function TodoList({ todos, onDelete, onUpdate, isAdmin  }) {
  if (todos.length === 0) {
    return (
      <div className="todo-list-empty bg-white p-6 rounded-xl shadow text-center text-gray-500">
        <style>
          {`
            @keyframes todoEmptyEnter {
              from {
                opacity: 0;
                transform: translateY(12px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .todo-list-empty {
              animation: todoEmptyEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            @media (prefers-reduced-motion: reduce) {
              .todo-list-empty {
                animation: none;
              }
            }
          `}
        </style>
        No todos found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isAdmin={isAdmin}
          animationDelay={Math.min(index * 55, 330)}
        />
      ))}
    </div>
  );
}

export default TodoList;
