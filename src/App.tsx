import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CaseManagement from './pages/CaseManagement';
import CollabBoard from './pages/CollabBoard';
import ProductionTools from './pages/ProductionTools';
import AssetLibrary from './pages/AssetLibrary';
import ExportCenter from './pages/ExportCenter';
import BrandSettings from './pages/BrandSettings';
import SystemSettings from './pages/SystemSettings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<CaseManagement />} />
        <Route path="/collab" element={<CollabBoard />} />
        <Route path="/production" element={<ProductionTools />} />
        <Route path="/library" element={<AssetLibrary />} />
        <Route path="/export" element={<ExportCenter />} />
        <Route path="/brand" element={<BrandSettings />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Route>
    </Routes>
  );
}
