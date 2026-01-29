import API from "./axios";

export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await API.post("/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Fetch logged-in user
  const me = await API.get("/me");

  return {
    access_token: res.data.access_token,
    user: me.data,
  };
};
