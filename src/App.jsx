import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LooviLogin from './pages/LooviLogin'
import Consulta from './pages/Consulta'
import MeusContratos from './pages/MeusContratos'
import AdminContratosTeste from './pages/AdminContratosTeste'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/consulta" replace />} />
        <Route path="/loovi-login" element={<LooviLogin />} />
        <Route path="/consulta" element={<Consulta />} />
        <Route path="/meus-contratos" element={<MeusContratos />} />
        {import.meta.env.DEV && (
          <Route path="/admin-teste-contratos" element={<AdminContratosTeste />} />
        )}
        <Route path="*" element={<Navigate to="/consulta" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
