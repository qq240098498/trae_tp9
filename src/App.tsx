import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Buildings from '@/pages/Buildings'
import Rooms from '@/pages/Rooms'
import Workers from '@/pages/Workers'
import Dormitory from '@/pages/Dormitory'
import RoomStatus from '@/pages/RoomStatus'
import Records from '@/pages/Records'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="buildings" element={<Buildings />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="workers" element={<Workers />} />
          <Route path="dormitory" element={<Dormitory />} />
          <Route path="room-status" element={<RoomStatus />} />
          <Route path="records" element={<Records />} />
        </Route>
      </Routes>
    </Router>
  );
}
