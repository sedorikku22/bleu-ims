import React, {useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/home/dashboard/dashboard';
import RecipeManagement from './components/home/recipeManagement/recipeManagement';
import Products from './components/home/products/products';
import Ingredients from './components/home/ingredients/ingredients';
import Supplies from './components/home/supplies/supplies';
import Merchandise from './components/home/merchandise/merchandise';
import Waste from './components/home/systemLogs/waste/waste';
import RestockLogs from './components/home/systemLogs/restockLogs/restockLogs';
import AuditLogs from './components/home/auditLogs/auditLogs';
import AddOnAuditLogs from './components/home/auditLogs/addOnAuditLogs';
import ProductsAuditLogs from './components/home/auditLogs/productsAuditLogs';
import ProductTypeAuditLogs from './components/home/auditLogs/productTypeAuditLogs';
import IngredientsAuditLogs from './components/home/auditLogs/ingredientsAuditLogs';
import MerchandiseAuditLogs from './components/home/auditLogs/merchandiseAuditLogs';
import MaterialsAuditLogs from './components/home/auditLogs/materialsAuditLogs';
import RecipeAuditLogs from './components/home/auditLogs/recipeAuditLogs';
import RestockAuditLogs from './components/home/auditLogs/restockAuditLogs';
import WasteAuditLogs from './components/home/auditLogs/wasteAuditLogs';

 


function RedirectToLoginSystem() {
  useEffect(() => {
    window.location.href = "http://localhost:4002/";
  }, []);

  return null; 
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectToLoginSystem />} />
        <Route path="/home/dashboard" element={<Dashboard />} />
        <Route path="/home/recipeManagement" element={<RecipeManagement />} />
        <Route path="/home/products" element={<Products />} />
        <Route path="/home/ingredients" element={<Ingredients />} />
        <Route path="/home/supplies" element={<Supplies />} />
        <Route path="/home/merchandise" element={<Merchandise />} />
        <Route path="/home/waste" element={<Waste />} />
        <Route path="/home/restockLogs" element={<RestockLogs />} />
        <Route path="/home/auditLogs" element={<AuditLogs />} />
        <Route path="/audit-logs/add-ons" element={<AddOnAuditLogs />} />
        <Route path="/audit-logs/products" element={<ProductsAuditLogs />} />
        <Route path="/audit-logs/product-type" element={<ProductTypeAuditLogs />} />
        <Route path="/audit-logs/ingredients" element={<IngredientsAuditLogs />} />
        <Route path="/audit-logs/merchandise" element={<MerchandiseAuditLogs />} />
        <Route path="/audit-logs/materials" element={<MaterialsAuditLogs />} />
        <Route path="/audit-logs/recipe" element={<RecipeAuditLogs />} />
        <Route path="/audit-logs/restock" element={<RestockAuditLogs />} />
        <Route path="/audit-logs/waste" element={<WasteAuditLogs />} />
        


      </Routes>
    </Router>
  );
}

export default App;