import UserItem from "./UserItem";

function UserList({ users, onDelete }) {
  if (users.length === 0) {
    return (
      <div className="user-list-empty bg-white p-6 rounded-xl shadow text-center text-gray-500">
        <style>
          {`
            @keyframes userEmptyEnter {
              from {
                opacity: 0;
                transform: translateY(12px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            .user-list-empty {
              animation: userEmptyEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
            }

            @media (prefers-reduced-motion: reduce) {
              .user-list-empty {
                animation: none;
              }
            }
          `}
        </style>
        No users found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user, index) => (
        <UserItem
          key={user.id}
          user={user}
          onDelete={onDelete}
          animationDelay={Math.min(index * 55, 330)}
        />
      ))}
    </div>
  );
}

export default UserList;