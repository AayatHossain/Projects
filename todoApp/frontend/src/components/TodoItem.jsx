import { useState } from "react";

function TodoItem({ todo, onDelete, onUpdate, isAdmin }) {
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

  if (isEditing && !isAdmin) {
    return (
      <div className="ui-card p-5 space-y-3">
        <input
          className="ui-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="ui-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          min="1"
          max="5"
          className="ui-input"
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          <label className="text-sm text-neutral-600">
            Completed
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="ui-btn ui-btn-primary ui-btn-sm"
          >
            Save
          </button>

          <button
            onClick={handleCancel}
            className="ui-btn ui-btn-secondary ui-btn-sm"
          >
            Cancel
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="ui-card p-5 relative">

      <div className="absolute top-3 right-3 flex gap-2">

        {!isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="ui-btn ui-btn-outline ui-btn-sm"
          >
            Edit
          </button>
        )}

        <button
          onClick={() => onDelete(todo.id)}
          className="ui-btn ui-btn-destructive ui-btn-sm"
        >
          Remove
        </button>
      </div>

      <h2 className="text-lg font-semibold text-neutral-900 pr-28">
        {todo.title}
      </h2>

      <p className="text-neutral-600 mt-1 break-words whitespace-pre-wrap">
        {todo.description || "No description"}
      </p>

      {isAdmin && (
        <p className="text-sm font-semibold text-neutral-700 mt-1">
          Owner ID: {todo.owner_id}
        </p>
      )}

      <div className="flex justify-between items-center mt-3">
        <span className="ui-badge ui-badge-secondary">
          Priority: {todo.priority}
        </span>

        <span
          className={`ui-badge ${todo.completed ? "ui-badge-success" : "ui-badge-outline"}`}
        >
          {todo.completed ? "Completed" : "Pending"}
        </span>
      </div>

    </div>
  );
}

export default TodoItem;
