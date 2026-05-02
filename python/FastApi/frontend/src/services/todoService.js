import API from "../api";

export const getTodos = async () => {
  const res = await API.get("/todo/"); 
  return res.data;
};

export const createTodo = async (todo) => {
  const res = await API.post("/todo/", todo);
  return res.data;
};

export const deleteTodo = async (id) => {
  await API.delete(`/todo/${id}`);
};