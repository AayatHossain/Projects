import UserItem from "./UserItem";

function UserList({ users, onDelete }) {
  if (users.length === 0) {
    return (
      <div className="ui-card p-6 text-center text-neutral-500">
        No users found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default UserList;
