function UserItem({ user, onDelete, animationDelay = 0 }) {
  const cardAnimationStyle = {
    animationDelay: `${animationDelay}ms`,
  };

  return (
    <div className="user-item-card bg-white p-5 rounded-xl shadow relative border border-transparent" style={cardAnimationStyle}>
      <style>
        {`
          @keyframes userItemEnter {
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

          .user-item-card {
            animation: userItemEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
            transform-origin: center;
            transition:
              transform 190ms ease,
              box-shadow 190ms ease,
              border-color 190ms ease;
            will-change: transform;
          }

          .user-item-card:hover {
            transform: scale(1.025);
            box-shadow: 0 18px 38px rgba(31, 41, 55, 0.18);
          }

          .user-item-action {
            transition: transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
          }

          .user-item-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 18px rgba(31, 41, 55, 0.18);
          }

          .user-item-action:active {
            transform: translateY(0) scale(0.97);
          }

          @media (prefers-reduced-motion: reduce) {
            .user-item-card,
            .user-item-card:hover,
            .user-item-action,
            .user-item-action:hover,
            .user-item-action:active {
              animation: none;
              transform: none;
              transition: none;
            }
          }
        `}
      </style>

      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={() => onDelete(user.id)}
          className="user-item-action bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
        >
          Remove
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {user.username}
      </h2>

      <p className="text-gray-600 mt-1 break-words">
        {user.email || "No email"}
      </p>

      <p className="text-sm font-bold mt-1">
        User ID: {user.id}
      </p>

      <div className="flex justify-between items-center mt-3">
        <span className="text-sm px-3 py-1 rounded-md bg-indigo-100 text-indigo-600">
          Role: {user.role || "unknown"}
        </span>

        <span className="text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-600">
          {user.phone_number || "No phone"}
        </span>
      </div>
    </div>
  );
}

export default UserItem;