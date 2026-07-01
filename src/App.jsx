import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LooviLogin from './pages/LooviLogin'
import Consulta from './pages/Consulta'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/loovi-login" element={<LooviLogin />} />
        <Route path="/consulta" element={<Consulta />} />
      </Routes>
    </BrowserRouter>
  )
}
