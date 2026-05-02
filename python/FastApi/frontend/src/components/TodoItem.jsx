import { useState } from "react";

function TodoItem({ todo, onDelete, onUpdate }) {
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

  if (isEditing) {
    return (
      <div className="bg-white p-5 rounded-xl shadow space-y-3">

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
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Save
          </button>

          <button
            onClick={handleCancel}
            className="bg-gray-400 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow relative">

      <div className="absolute top-3 right-3 flex gap-2">

        <button
          onClick={() => setIsEditing(true)}
          className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(todo.id)}
          className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
        >
          Remove
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {todo.title}
      </h2>

      <p className="text-gray-600 mt-1">
        {todo.description || "No description"}
      </p>

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