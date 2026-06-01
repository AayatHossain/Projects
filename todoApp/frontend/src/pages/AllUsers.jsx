import { useEffect, useState } from "react";
import { getAllUsers, adminDeleteUser } from "../services/todoService";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import UserList from "../components/UserList";

function AllUsers() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // block non-admin
      if (decoded.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      setUsername(decoded.sub);
    } catch {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [navigate]);

  const handleDeleteUser = async (id) => {
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">

      {/* Header */}
      <div className="ui-card max-w-6xl mx-auto flex justify-between items-center mb-8 p-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Todo App</h1>
          <p className="text-sm text-neutral-500">
            Logged in as {username}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/admin/users")}
            className="ui-btn ui-btn-primary"
          >
            All Users
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="ui-btn ui-btn-outline"
          >
            All Todos
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="ui-btn ui-btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Centered User List */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">All Users</h2>
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <UserList
            users={users}
            onDelete={handleDeleteUser}
          />
        </div>
      </div>

    </div>
  );
}

export default AllUsers;
