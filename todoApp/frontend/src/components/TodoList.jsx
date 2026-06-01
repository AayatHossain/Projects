import TodoItem from "./TodoItem";

function TodoList({ todos, onDelete, onUpdate, isAdmin  }) {
  if (todos.length === 0) {
    return (
      <div className="ui-card p-6 text-center text-neutral-500">
        No todos found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

export default TodoList;
