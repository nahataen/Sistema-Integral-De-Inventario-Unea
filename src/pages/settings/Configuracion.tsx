import { useNavigate } from "react-router-dom";
import styles from "./Configuracion.module.css";

const Configuracion = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Configuración
      </h1>
      <button
        onClick={() => navigate("/")}
        className={styles.backButton}
      >
        Regresar al Dashboard
      </button>
    </div>
  );
};

export default Configuracion;