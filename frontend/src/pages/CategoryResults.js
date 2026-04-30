import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CategoryResults() {
  const navigate = useNavigate(); // redirect link
  const location = useLocation(); // 

  useEffect(() => {
    const params = new URLSearchParams(location.search); 
    const name = params.get("name") || location.state?.category || ""; // getting query from URL 
    if (name) {
      navigate(`/services?category=${encodeURIComponent(name)}`, { replace: true }); // category navigation
    } else {
      navigate("/services", { replace: true });
    }
  }, [navigate, location]);

  return null;
}
