import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Página de Inicio</h1>
      <button onClick={() => navigate("/otra")}>Ir a Otra Vista</button>
    </div>
  );
}

export default Home;
