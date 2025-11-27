import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import styles from "./about.module.css";

const AboutPage = () => {
  const navigate = useNavigate();

  //funcion para abrir correo
  const handleCopyEmail = async () => {
    const email = " 0322103855@ut-tijuana.edu.mx";
    try {
      await navigator.clipboard.writeText(email);
      alert("Correo copiado al portapapeles");
    } catch (err) {
      console.error("Error al copiar el correo: ", err);
      alert("Error al copiar el correo");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <button
            onClick={() => navigate(-1)}
            className={styles.backButton}
            title="Volver"
          >
            <LuArrowLeft size={20} />
            Volver
          </button>
          <h1 className={styles.title}>
            Acerca del Sistema de Almacén UNEA
          </h1>
          <p className={styles.subtitle}>
            Sistema de gestión de inventario para la Universidad Tecnológica de Tijuana
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Desarrollo del Sistema
          </h2>
          <p className={styles.text}>
            Desarrollado por <strong>Jesús Nahataen Salas Figueroa</strong> como parte de su estadía profesional.
          </p>
        </section>

        <section className={styles.contactSection}>
          <h2 className={styles.contactTitle}>
            Contacto
          </h2>
          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>Correo electrónico:</span>
              <button
                onClick={handleCopyEmail}
                className={styles.contactButton}
              >
                0322103855@ut-tijuana.edu.mx
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AboutPage;