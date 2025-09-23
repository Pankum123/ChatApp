// import React, { useEffect, useState } from "react";
// import Cookies from "js-cookie";
// import axios from "axios";
// import { getAllUsers } from '../api'
// function useGetAllUsers() {
//   const [allUsers, setAllUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   useEffect(() => {
//     const getUsers = async () => {
//       setLoading(true);
//       try {
//         const token = Cookies.get("jwt");
//         // const response = await axios.get("/api/user/allusers", {
//         //   credentials: "include",
//         //   headers: {
//         //     Authorization: `Bearer ${token}`,
//         //   },
//         // });
//         // Use VITE_API_URL from environment
//         const API_URL = import.meta.env.VITE_API_URL;

//         const response = await axios.get(`${API_URL}/api/user/allusers`, {
//           withCredentials: true, // use withCredentials instead of credentials in axios
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         // const response = await getAllUsers();
//         setAllUsers(response.data);
//         setLoading(false);
//       } catch (error) {
//         console.log("Error in useGetAllUsers: " + error);
//       }
//     };
//     getUsers();
//   }, []);
//   return [allUsers, loading];
// }

// export default useGetAllUsers;


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
        const token = Cookies.get("jwt");

        if (!token) {
          console.log("JWT token not found. User might not be logged in.");
          setLoading(false);
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL; // works in prod and dev

        const response = await axios.get(`${API_URL}/api/user/allusers`, {
          withCredentials: true, // ensures cookies are sent
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAllUsers(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Unauthorized! Token might be invalid or expired.");
          // Optional: redirect to login page
          // window.location.href = "/login";
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
