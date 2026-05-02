function TodoItem({ todo }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">

      <h2 className="text-lg font-semibold text-gray-900">
        {todo.title}
      </h2>

      <p className="text-gray-600 mt-1">
        {todo.description || "No description"}
      </p>

      <div className="flex justify-between items-center mt-3">

        <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-600">
          Priority: {todo.priority}
        </span>

        <span
          className={`text-sm ${
            todo.completed
              ? "text-green-500"
              : "text-gray-400"
          }`}
        >
          {todo.completed ? "Completed" : "Pending"}
        </span>

      </div>

    </div>
  );
}

export default TodoItem;