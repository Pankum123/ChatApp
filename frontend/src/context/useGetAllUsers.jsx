import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { getAllUsers } from '../api'
function useGetAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("jwt");
        // const response = await axios.get("/api/user/allusers", {
        //   credentials: "include",
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });
        // Use VITE_API_URL from environment
        const API_URL = import.meta.env.VITE_API_URL;

        const response = await axios.get(`${API_URL}/user/allusers`, {
          withCredentials: true, // use withCredentials instead of credentials in axios
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // const response = await getAllUsers();
        setAllUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.log("Error in useGetAllUsers: " + error);
      }
    };
    getUsers();
  }, []);
  return [allUsers, loading];
}

export default useGetAllUsers;

