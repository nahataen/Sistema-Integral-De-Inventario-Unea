import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 5, 10, 0.9)',
      backdropFilter: 'blur(25px)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(15, 15, 25, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '1.5rem',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
        }}>
          Sistema de Almacén UNEA
        </h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#b0b0b0',
          marginBottom: '2rem',
          maxWidth: '600px',
          lineHeight: '1.6'
        }}>
          Gestiona eficientemente tu inventario con nuestra interfaz moderna y intuitiva.
          Accede a todas las funcionalidades desde el menú lateral.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            background: 'rgba(37, 99, 235, 0.3)',
            color: '#ffffff',
            border: '1px solid rgba(37, 99, 235, 0.4)',
            borderRadius: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          🚀 Acceder al Dashboard
        </button>
      </div>
    </div>
  );
}

export default Home;