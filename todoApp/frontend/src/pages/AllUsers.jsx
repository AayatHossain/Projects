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

      // 🔐 block non-admin
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">All Users</h1>
          <p className="text-sm text-indigo-100">
            Logged in as {username}
          </p>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Back to Admin Panel
        </button>
      </div>

      {/* Centered User List */}
      <div className="max-w-4xl mx-auto bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg max-h-[75vh] overflow-y-auto">
        <UserList
          users={users}
          onDelete={handleDeleteUser}
        />
      </div>

    </div>
  );
}

export default AllUsers;