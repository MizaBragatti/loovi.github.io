export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#e3ecf7] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A3D91]">Loovi Seguros</h1>
          <p className="text-[#3E7CB1] mt-1">Sistema de Consulta FIPE</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 Loovi Seguros. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
