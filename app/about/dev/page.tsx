export default function AboutDevPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Sobre el desarrollador</h1>
        <p className="text-lg text-gray-700">
          Este sitio fue desarrollado por Josvaneiba como parte de la plataforma Beauty Therapist. Si tienes preguntas,
          sugerencias o encuentras un problema, no dudes en contactarme.
        </p>
        <div className="mt-6 space-y-2 text-gray-700">
          <p>Email: <a className="underline" href="mailto:contact@josvaneiba.dev">contact@josvaneiba.dev</a></p>
          <p>Github: <a className="underline" href="https://github.com/josvaneiba">github.com/josvaneiba</a></p>
        </div>
      </div>
    </div>
  )
}
