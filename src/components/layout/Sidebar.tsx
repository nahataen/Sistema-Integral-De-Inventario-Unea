import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import styles from "../../styles/Sidebar.module.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const dbName = location.state?.dbName || "Desconocida";
  const tableName = location.state?.tableName || null;

  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const overflowing =
          textRef.current.scrollWidth > containerRef.current.clientWidth + 5;
        setIsOverflowing(overflowing);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [dbName]);

  return (
    <aside className={styles.sidebar}>
      {/* 🔷 Logo */}
      <div className={styles.logoContainer}>
        <img src="/unealogo.svg" alt="UNEA Logo" className={styles.logo} />
      </div>

      {/* 🧭 Navegación */}
      <nav className={styles.nav}>
        <button
          onClick={() => navigate("/", { state: { dbName } })}
          className={`${styles.navButton} ${
            location.pathname === "/" ? styles.active : ""
          }`}
        >
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.text}>Base de datos</span>
        </button>

        <button
          onClick={() => navigate("/about", { state: { dbName } })}
          className={`${styles.navButton} ${
            location.pathname === "/about" ? styles.active : ""
          }`}
        >
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <line
              x1="12"
              y1="16"
              x2="12"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="8"
              x2="12.01"
              y2="8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.text}>Acerca de</span>
        </button>
      </nav>

      {/* 💾 Base actual */}
      <div className={styles.currentDbBox}>
        <span className={styles.dbIndicator}></span>
        <div className={styles.dbTextBox}>
          <div ref={containerRef} className={styles.dbName}>
            <div
              ref={textRef}
              className={`${styles.dbInnerText} ${
                isOverflowing ? styles.scroll : ""
              }`}
            >
              {dbName === "Desconocida"
                ? "Sin conexión"
                : `Base actual: ${dbName}`}
            </div>
          </div>

          {tableName && (
            <span className={styles.editingTable}>
              <svg
                className={styles.editIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M17.414 2.586a2 2 0 0 1 0 2.828l-8.707 8.707-3.536.707.707-3.536L14.585 2.586a2 2 0 0 1 2.829 0z" />
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Editando: <b>{tableName}</b>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
