import API from "../api";

export const registerUser = async (userData) => {
  const res = await API.post("/auth/", {
    username: userData.username,
    email: userData.email,
    password: userData.password,
    phone_number: userData.phone_number,
    role: "user",
  });
  return res.data;
};