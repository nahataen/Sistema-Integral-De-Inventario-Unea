
const AboutPage = () => { 

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
    <main className="min-h-screen bg-gray-800 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-blue-400">
            Acerca del Sistema de Almacén UNEA
          </h1>
          <p className="text-lg text-gray-300">
            Sistema de gestión de inventario para la Universidad Tecnológica de Tijuana
          </p>
        </header>

        <section className="space-y-4 bg-gray-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Desarrollo del Sistema
          </h2>
          <p className="text-lg leading-relaxed">
            Desarrollado por <strong>Jesús Nahataen Salas Figueroa</strong> como parte de su estadía profesional.
          </p>
        </section>

        <section className="bg-gray-700 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Contacto
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="text-lg">Correo electrónico:</span>
              <button
                onClick={handleCopyEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors duration-200"
              >
                0322103855@ut-tijuana.edu.mx
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AboutPage;

