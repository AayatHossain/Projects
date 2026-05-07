// import { useEffect, useState } from "react";
// import { getTodos, createTodo, deleteTodo, updateTodo } from "../services/todoService";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import TodoList from "../components/TodoList";
// import CreateTodo from "../components/CreateTodo";

// function Dashboard() {
//   const [todos, setTodos] = useState([]);
//   const [username, setUsername] = useState("");
//   const [isAdmin, setIsAdmin] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       navigate("/");
//       return;
//     }

//     try {
//       const decoded = jwtDecode(token);
//       setUsername(decoded.sub);
//       setIsAdmin(decoded.role === "admin");
//     } catch {
//       navigate("/");
//       return;
//     }

//     const load = async () => {
//       try {
//         const data = await getTodos();
//         setTodos(data);
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     load();
//   }, [navigate]);

//   const handleAddTodo = async (todo) => {
//     try {
//       const created = await createTodo(todo);
//       setTodos((prev) => [created, ...prev]);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleUpdateTodo = async (id, updatedData) => {
//     try {
//       const updated = await updateTodo(id, updatedData);
//       setTodos((prev) =>
//         prev.map((t) => (t.id === id ? updated : t))
//       );
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleDeleteTodo = async (id) => {
//     try {
//       await deleteTodo(id);
//       setTodos((prev) => prev.filter((t) => t.id !== id));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     navigate("/");
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

//       {/* Header */}
//       <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg">
//         <div>
//           <h1 className="text-2xl font-bold text-white">My Todos</h1>
//           <p className="text-sm text-indigo-100">
//             Welcome, {username}
//           </p>
//         </div>

//         <div className="flex gap-2">
//           {isAdmin && (
//             <button
//               onClick={() => navigate("/admin")}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
//             >
//               Admin Panel
//             </button>
//           )}

//           <button
//             onClick={handleLogout}
//             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* Main Layout */}
//       <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

//         {/* Left: Create Todo */}
//         <div className="md:col-span-1 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg h-fit sticky top-6">
//           <CreateTodo onAdd={handleAddTodo} />
//         </div>

//         {/* Right: Todo List */}
//         <div className="md:col-span-2 bg-white/20 backdrop-blur-md p-4 rounded-xl shadow-lg max-h-[75vh] overflow-y-auto">
//           <TodoList
//             todos={todos}
//             onDelete={handleDeleteTodo}
//             onUpdate={handleUpdateTodo}
//           />
//         </div>

//       </div>
//     </div>
//   );
// }

// export default Dashboard;
