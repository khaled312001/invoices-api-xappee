
export const checkStatusAndRole = (status: string, role: string) => {
  if (
    status &&
    status !== "active" &&
    status !== "deleted" &&
    status !== "suspended"
  )
    return false;

  if (
    !role ||
    (role !== "super" &&
      role !== "manager" &&
      role !== "admin" &&
      role !== "user")
  )
    return false;

  return true;
};
