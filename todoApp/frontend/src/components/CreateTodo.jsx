import { useState } from "react";

function CreateTodo({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
  setError("");

  const newTodo = {
    title,
    description,
    priority,
    completed: false,
  };

  try {
    await onAdd(newTodo);
    setTitle("");
    setDescription("");
    setPriority(1);
  } catch (err) {
    const details = err.response?.data?.detail;

    if (details && details.length > 0) {
      const field = details[0].loc[1];
      const message = details[0].msg;

      let formatted = "";

      if (field === "title" && message.includes("at least")) {
        formatted = "Title should have at least 5 characters";
      } else if (field === "description" && message.includes("at least")) {
        formatted = "Description should have at least 10 characters";
      } else {
        formatted = `${field}: ${message}`;
      }

      setError(formatted);
    } else {
      setError("Something went wrong");
    }
  }
};

  return (
    <div className="bg-white p-5 rounded-xl shadow mb-6 space-y-4">

      <h2 className="text-lg font-semibold">Create Todo</h2>

      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}

      <div>
        <label className="text-sm text-gray-600">Title</label>
        <input
          className="w-full p-2 border rounded mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Description</label>
        <textarea
          className="w-full p-2 border rounded mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm text-gray-600">Priority (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          className="w-full p-2 border rounded mt-1"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
      >
        Add Todo
      </button>

    </div>
  );
}

export default CreateTodo;