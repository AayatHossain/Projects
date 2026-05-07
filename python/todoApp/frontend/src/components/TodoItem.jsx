import { useState } from "react";

function TodoItem({ todo, onDelete, onUpdate, isAdmin, animationDelay = 0 }) {
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(todo.title || "");
  const [description, setDescription] = useState(todo.description || "");
  const [priority, setPriority] = useState(todo.priority || 1);
  const [completed, setCompleted] = useState(todo.completed);

  const handleSave = async () => {
    const updatedData = {
      title,
      description,
      priority,
      completed,
    };

    try {
      await onUpdate(todo.id, updatedData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    // reset values back to original todo
    setTitle(todo.title || "");
    setDescription(todo.description || "");
    setPriority(todo.priority || 1);
    setCompleted(todo.completed);
    setIsEditing(false);
  };

  const cardAnimationStyle = {
    animationDelay: `${animationDelay}ms`,
  };

  const animationStyles = (
    <style>
      {`
        @keyframes todoItemEnter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.97);
            filter: blur(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .todo-item-card {
          animation: todoItemEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center;
          transition:
            transform 190ms ease,
            box-shadow 190ms ease,
            border-color 190ms ease;
          will-change: transform;
        }

        .todo-item-card:hover {
          transform: scale(1.025);
          box-shadow: 0 18px 38px rgba(31, 41, 55, 0.18);
        }

        .todo-item-card:focus-within {
          transform: scale(1.01);
          box-shadow: 0 16px 34px rgba(31, 41, 55, 0.16);
        }

        .todo-item-action {
          transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
        }

        .todo-item-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(31, 41, 55, 0.18);
        }

        .todo-item-action:active {
          transform: translateY(0) scale(0.97);
        }

        @media (prefers-reduced-motion: reduce) {
          .todo-item-card,
          .todo-item-card:hover,
          .todo-item-card:focus-within,
          .todo-item-action,
          .todo-item-action:hover,
          .todo-item-action:active {
            animation: none;
            transform: none;
            transition: none;
          }
        }
      `}
    </style>
  );

  if (isEditing && !isAdmin) {
    return (
      <div className="todo-item-card bg-white p-5 rounded-xl shadow space-y-3 border border-transparent" style={cardAnimationStyle}>
        {animationStyles}

        <input
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          min="1"
          max="5"
          className="w-full p-2 border rounded"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          <label className="text-sm text-gray-600">
            Completed
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="todo-item-action bg-green-500 text-white px-3 py-1 rounded"
          >
            Save
          </button>

          <button
            onClick={handleCancel}
            className="todo-item-action bg-gray-400 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="todo-item-card bg-white p-5 rounded-xl shadow relative border border-transparent" style={cardAnimationStyle}>
      {animationStyles}

      <div className="absolute top-3 right-3 flex gap-2">

        {!isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="todo-item-action bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Edit
          </button>
        )}

        <button
          onClick={() => onDelete(todo.id)}
          className="todo-item-action bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
        >
          Remove
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {todo.title}
      </h2>

      <p className="text-gray-600 mt-1 break-words whitespace-pre-wrap">
        {todo.description || "No description"}
      </p>

      {isAdmin && (
        <p className="text-sm font-bold mt-1">
          Owner ID: {todo.owner_id}
        </p>
      )}

      <div className="flex justify-between items-center mt-3">
        <span className="text-sm px-3 py-1 rounded-md bg-indigo-100 text-indigo-600">
          Priority: {todo.priority}
        </span>

        <span
          className={`text-sm px-3 py-1 rounded-md text-white ${todo.completed ? "bg-green-500" : "bg-gray-400"
            }`}
        >
          {todo.completed ? "Completed" : "Pending"}
        </span>
      </div>

    </div>
  );
}

export default TodoItem;
