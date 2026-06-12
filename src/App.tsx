import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Buildings from '@/pages/Buildings'
import Rooms from '@/pages/Rooms'
import Workers from '@/pages/Workers'
import Dormitory from '@/pages/Dormitory'
import RoomStatus from '@/pages/RoomStatus'
import Records from '@/pages/Records'
import Devices from '@/pages/Devices'
import Maintenance from '@/pages/Maintenance'
import UtilityReading from '@/pages/UtilityReading'
import Bills from '@/pages/Bills'
import ExpenseLedger from '@/pages/ExpenseLedger'
import Reminders from '@/pages/Reminders'
import Arrears from '@/pages/Arrears'
import Deposit from '@/pages/Deposit'
import FeeSupplement from '@/pages/FeeSupplement'

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
          <Route path="devices" element={<Devices />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="utility-reading" element={<UtilityReading />} />
          <Route path="bills" element={<Bills />} />
          <Route path="expense-ledger" element={<ExpenseLedger />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="arrears" element={<Arrears />} />
          <Route path="deposit" element={<Deposit />} />
          <Route path="fee-supplement" element={<FeeSupplement />} />
          <Route path="records" element={<Records />} />
        </Route>
      </Routes>
    </Router>
  );
}
