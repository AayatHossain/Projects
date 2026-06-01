function UserItem({ user, onDelete }) {
  return (
    <div className="ui-card p-5 relative">
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => onDelete(user.id)}
          className="ui-btn ui-btn-destructive ui-btn-sm"
        >
          Remove
        </button>
      </div>

      <h2 className="text-lg font-semibold text-neutral-900 pr-20">
        {user.username}
      </h2>

      <p className="text-neutral-600 mt-1 break-words">
        {user.email || "No email"}
      </p>

      <p className="text-sm font-semibold text-neutral-700 mt-1">
        User ID: {user.id}
      </p>

      <div className="flex justify-between items-center mt-3">
        <span className="ui-badge ui-badge-secondary">
          Role: {user.role || "unknown"}
        </span>

        <span className="ui-badge ui-badge-outline">
          {user.phone_number || "No phone"}
        </span>
      </div>
    </div>
  );
}

export default UserItem;
