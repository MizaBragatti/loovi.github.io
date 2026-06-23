import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'

export default function LoginClientes() {
  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Login de Clientes</h2>
      <p className="text-sm text-gray-500 mb-6">
        Área destinada aos clientes Loovi. Em breve disponível.
      </p>
      <Link
        to="/login"
        className="block text-center w-full py-2.5 rounded-lg border border-[#0A3D91]
          text-[#0A3D91] font-semibold hover:bg-[#0A3D91] hover:text-white transition-colors text-sm"
      >
        Voltar para Login
      </Link>
    </AuthLayout>
  )
}
