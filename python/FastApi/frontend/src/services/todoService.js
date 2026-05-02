import API from "../api";

export const getTodos = async () => {
  const res = await API.get("/todo/"); 
  return res.data;
};