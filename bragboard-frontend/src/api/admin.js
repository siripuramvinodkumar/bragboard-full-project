import api from "./axios";

export const createUser = (payload) => {
  return api.post("/admin/users?is_admin_flag=false", payload);
};

export const getAdminStats = () => {
  return api.get("/admin/stats");
};
