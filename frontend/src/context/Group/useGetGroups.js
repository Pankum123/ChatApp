
import { useEffect, useState } from "react";
import { getGroupsAPI } from "../../api";


function useGetGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getGroups = async () => {
      setLoading(true);

      try {
        const response = await getGroupsAPI();
        setGroups(response.data);
      } catch (error) {
        console.log(
          "Error in useGetGroups:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    getGroups();
  }, []);

  return [groups, loading, setGroups];
}

export default useGetGroups;
