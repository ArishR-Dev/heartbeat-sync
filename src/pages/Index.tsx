import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/room" replace />;
};

export default Index;
