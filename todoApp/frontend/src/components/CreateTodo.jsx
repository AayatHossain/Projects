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
    <div className="ui-card p-5 space-y-4">

      <h2 className="text-lg font-semibold text-neutral-900">Create Todo</h2>

      {error && (
        <p className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label className="ui-label">Title</label>
        <input
          className="ui-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="ui-label">Description</label>
        <textarea
          className="ui-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="ui-label">Priority (1–5)</label>
        <input
          type="number"
          min="1"
          max="5"
          className="ui-input"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="ui-btn ui-btn-primary w-full"
      >
        Add Todo
      </button>

    </div>
  );
}

export default CreateTodo;
