

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);

      try {
        const API_URL = import.meta.env.VITE_API_URL;

        // always send cookie, don't rely on reading it in frontend
        const response = await axios.get(`${API_URL}/api/user/allusers`, {
          withCredentials: true, 
          headers: {
            // optional: send token if present
            Authorization: Cookies.get("jwt")
              ? `Bearer ${Cookies.get("jwt")}`
              : undefined,
          },
        });

        setAllUsers(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Unauthorized! User might not be logged in.");
          // optional: redirect to login
        } else {
          console.log("Error in useGetAllUsers:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  return [allUsers, loading];
}

export default useGetAllUsers;
