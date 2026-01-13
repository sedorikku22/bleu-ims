import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import BlockchainAuditReport from './BlockchainAuditReport';
import LowStockModal from './lowStockModal';
import Sidebar from "../../sidebar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
  AreaChart, Area
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBoxOpen,
  faCubes,
  faBox,
  faExclamationTriangle,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import Header from "../../header";
import { getAuthHeaders } from './AuthContext';

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="bold">{payload.category}</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Count: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();

  // Dashboard metrics state
  const [totalProducts, setTotalProducts] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [notAvailable, setNotAvailable] = useState(0);

  // New sections state
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventoryByCategory, setInventoryByCategory] = useState([]);
  const [stockLevelsTrend, setStockLevelsTrend] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [currentAuditSection, setCurrentAuditSection] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentLowStockSection, setCurrentLowStockSection] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Audit sections
  const auditSections = ['Ingredients', 'Materials', 'Merchandise'];

  // Low Stock sections
  const lowStockSections = ['Ingredients', 'Supplies & Materials', 'Merchandise'];

  // URLs for backend endpoints
  const PRODUCT_COUNT_URL = "https://ims-productservices.onrender.com/is_products/count";
  const INGREDIENT_STOCK_STATUS_URL = "https://bleu-stockservices.onrender.com/ingredients/stock-status-counts";
  const MATERIAL_STOCK_STATUS_URL = "https://bleu-stockservices.onrender.com/materials/stock-status-counts";
  const MERCH_STOCK_STATUS_URL = "https://bleu-stockservices.onrender.com/merchandise/stock-status-counts";
  const INVENTORY_BY_CATEGORY_URL = "https://ims-productservices.onrender.com/is_products/inventory-by-category";
  const STOCK_HISTORY_URL = "https://bleu-stockservices.onrender.com/stockhistory";
  const LOW_STOCK_INGREDIENTS_URL = "https://bleu-stockservices.onrender.com/ingredients/low-stock";
  const LOW_STOCK_MATERIALS_URL = "https://bleu-stockservices.onrender.com/materials/low-stock";
  const LOW_STOCK_MERCHANDISE_URL = "https://bleu-stockservices.onrender.com/merchandise/low-stock";

  const handletotalItemsClick = () => {
    navigate('/home/products');
  }

  const mockAuditData = {
    ingredients: [
      { id: 1,
        timestamp: '2025-10-01 10:30:00',
        actionTaken: 'CREATE',
        productName: 'Vanilla Syrup',
        category: 'Ingredients',
        price: 15.50,
        status: 'Available' },
      { id: 2,
        timestamp: '2025-10-02 14:45:00',
        actionTaken: 'UPDATE',
        productName: 'Coffee Beans',
        category: 'Ingredients',
        price: 25.00,
        status: 'Low Stock' },
      { id: 3,
        timestamp: '2025-10-02 16:20:00',
        actionTaken: 'CREATE',
        productName: 'Milk',
        category: 'Ingredients',
        price: 8.75,
        status: 'Not Available' },
      { id: 4,
        timestamp: '2025-12-25 09:15:00',
        actionTaken: 'DELETE',
        productName: 'Arabica Beans',
        category: 'Ingredients',
        price: 12.30,
        status: 'Available' }
    ],
    materials: [
      { id: 1,
        timestamp: '2023-10-03 11:00:00',
        actionTaken: 'CREATE',
        productName: 'Paper Cups 12oz',
        category: 'Materials',
        price: 5.20,
        status: 'Available' },
      { id: 2,
        timestamp: '2023-10-04 13:30:00',
        actionTaken: 'UPDATE',
        productName: 'Napkins',
        category: 'Materials',
        price: 3.45,
        status: 'Low Stock' }
    ],
    merchandise: [
      { id: 1,
        timestamp: '2023-10-05 15:45:00',
        actionTaken: 'UPDATE',
        productName: 'Coffee Mug',
        category: 'Merchandise',
        price: 18.90,
        status: 'Available' },
      { id: 2,
        timestamp: '2023-10-06 17:00:00',
        actionTaken: 'DELETE',
        productName: 'T-Shirt',
        category: 'Merchandise',
        price: 22.50,
        status: 'Not Available' }
    ]
  };

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const headers = getAuthHeaders();

      const prodRes = await fetch(PRODUCT_COUNT_URL, { headers });
      const prodData = prodRes.ok ? await prodRes.json() : { count: 0 };
      setTotalProducts(prodData.count || 0);

      const [ingRes, matRes, merchRes] = await Promise.all([
        fetch(INGREDIENT_STOCK_STATUS_URL, { headers }),
        fetch(MATERIAL_STOCK_STATUS_URL, { headers }),
        fetch(MERCH_STOCK_STATUS_URL, { headers }),
      ]);

      // Process stock status data
      const ingData = ingRes.ok ? await ingRes.json() : {};
      const matData = matRes.ok ? await matRes.json() : {};
      const merchData = merchRes.ok ? await merchRes.json() : {};

      const totalAvailable = (ingData.available || 0) + (matData.available || 0) + (merchData.available || 0);
      const totalLowStock = (ingData.low_stock || 0) + (matData.low_stock || 0) + (merchData.low_stock || 0);
      const totalNotAvailable = (ingData.not_available || 0) + (matData.not_available || 0) + (merchData.not_available || 0);

      setAvailableStock(totalAvailable);
      setLowStock(totalLowStock);
      setNotAvailable(totalNotAvailable);

      // Fetch inventory by category
      const categoryRes = await fetch(INVENTORY_BY_CATEGORY_URL, { headers });
      const categoryData = categoryRes.ok ? await categoryRes.json() : [];
      setInventoryByCategory(categoryData);

      //  Fetch 7-day stock level history
      const historyRes = await fetch(STOCK_HISTORY_URL, { headers });

      let historyData = [];
      if (historyRes.ok) {
        historyData = await historyRes.json();
      }

      const formattedTrend = historyData.map(entry => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stockLevel: entry.total_stock
      }));
      setStockLevelsTrend(formattedTrend);

      // fetch low stock items
      const [lowIngRes, lowMatRes, lowMerchRes] = await Promise.all([
        fetch(LOW_STOCK_INGREDIENTS_URL, { headers }),
        fetch(LOW_STOCK_MATERIALS_URL, { headers }),
        fetch(LOW_STOCK_MERCHANDISE_URL, { headers })
      ]);

      const lowIngData = lowIngRes.ok ? await lowIngRes.json() : [];
      const lowMatData = lowMatRes.ok ? await lowMatRes.json() : [];
      const lowMerchData = lowMerchRes.ok ? await lowMerchRes.json() : [];

      const combinedLowStock = [
        ...lowIngData.map(item => ({
          id: item.id,
          name: item.name,
          inStock: parseFloat(item.in_stock),
          lastRestocked: item.last_restocked
            ? new Date(item.last_restocked).toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).replace(',', '')
            : 'N/A',
          status: item.status,
          type: 'Ingredient'
        })),
        ...lowMatData.map(item => ({
          id: item.id,
          name: item.name,
          inStock: parseFloat(item.in_stock),
          lastRestocked: item.last_restocked
            ? new Date(item.last_restocked).toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).replace(',', '')
            : 'N/A',
          status: item.status,
          type: 'Material'
        })),
        ...lowMerchData.map(item => ({
          id: item.id,
          name: item.name,
          inStock: parseFloat(item.in_stock),
          lastRestocked: item.last_restocked
            ? new Date(item.last_restocked).toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }).replace(',', '')
            : 'N/A',
          status: item.status,
          type: 'Merchandise'
        }))
      ];

      setLowStockItems(combinedLowStock);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  fetchDashboardData();
}, []);

  const formatValue = (value, format) => {
    return format === "currency"
      ? `₱${value.toLocaleString()}`
      : value.toLocaleString();
  };

  const handleAuditNavigation = (direction) => {
    if (direction === 'next' && currentAuditSection < auditSections.length - 1) {
      setCurrentAuditSection(currentAuditSection + 1);
    } else if (direction === 'prev' && currentAuditSection > 0) {
      setCurrentAuditSection(currentAuditSection - 1);
    }
  };

  const handleLowStockNavigation = (direction) => {
    if (direction === 'next' && currentLowStockSection < lowStockSections.length - 1) {
      setCurrentLowStockSection(currentLowStockSection + 1);
    } else if (direction === 'prev' && currentLowStockSection > 0) {
      setCurrentLowStockSection(currentLowStockSection - 1);
    }
  };

  const getCurrentAuditData = () => {
    const section = auditSections[currentAuditSection].toLowerCase();
    let data = auditData[section] || [];
    if (startDate) {
      data = data.filter(item => item.timestamp.split(' ')[0] >= startDate);
    }
    if (endDate) {
      data = data.filter(item => item.timestamp.split(' ')[0] <= endDate);
    }
    return data.slice(0, 5);
  };

  const getCurrentLowStockData = () => {
    const section = lowStockSections[currentLowStockSection];
    const typeMap = {
      'Ingredients': 'Ingredient',
      'Supplies & Materials': 'Material',
      'Merchandise': 'Merchandise'
    };
    const targetType = typeMap[section];
    return lowStockItems.filter(item => item.type === targetType).slice(0, 5);
  };

  const exportToPDF = () => {
    
    console.log('Exporting to PDF with filters:', { startDate, endDate });
    alert(`PDF export functionality would be implemented here. Filters: From ${startDate || 'N/A'} to ${endDate || 'N/A'}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical': return '#ff6b6b';
      case 'low': return '#ffa726';
      case 'good': return '#66bb6a';
      default: return '#78909c';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'low': return 'Low Stock';
      default: return status;
    }
  };

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return '+';
      case 'UPDATE': return '✓';
      case 'DELETE': return '×';
      default: return '•';
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="roles">
        <Header pageTitle="Dashboard" />
        <div className="dashboard-contents">
          {/* Hello Section */}
          <div className="dashboard-hello">
            <h2>Hello!</h2>
            <p>Here's Your Latest Inventory Overview</p>
          </div>

          {/* Dashboard Cards */}
           <div className="dashboard-cards dashboard-cards-clean">
            <div className="card-products" onClick={handletotalItemsClick} style={{ cursor: 'pointer' }}>
              <div className="card-text">
                <div className="card-title">Total Items</div>
                <div className="card-value">{totalProducts}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
            </div>

            <div className="card-ingredients">
              <div className="card-text">
                <div className="card-title">Low Stock Items</div>
                <div className="card-value">{lowStock}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
            </div>

            <div className="card-materials">
              <div className="card-text">
                <div className="card-title">Available Items</div>
                <div className="card-value">{availableStock}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faCubes} />
              </div>
            </div>

            <div className="card-merchandise">
              <div className="card-text">
                <div className="card-title">Out of Stock Items</div>
                <div className="card-value">{notAvailable}</div>
              </div>
              <div className="card-icon">
                <FontAwesomeIcon icon={faBox} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="dashboard-charts">
            <div className="chart-box">
              <div className="chart-header">
                <span>Inventory By Category</span>
                <span className="chart-subtitle">Distribution of Items by Category</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={inventoryByCategory}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#4B929D"
                    labelLine={false}
                    label={({ percent, category }) => `${(percent * 100).toFixed(0)}%`}
                    onClick={(data, index) => setActiveIndex(index)}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                  >
                    {inventoryByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={activeIndex === index ? '#4B929D' : '#898989'}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <div className="chart-header">
                <span>Stock Levels Trend</span>
                <span className="chart-subtitle">7-days Inventory Stock Level History</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={stockLevelsTrend}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7FB5B5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7FB5B5" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="stockLevel" 
                    stroke="#4B929D" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorStock)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Items Section */}
          <div className="dashboard-section low-stock-section">
              <div className="section-header">
                <div className="section-title">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>Low Stock Items</span>
                </div>
                <button className="view-all-btn" onClick={() => setIsModalOpen(true)}>View All</button>
              </div>
            <div className="section-content">
              <div className="audit-navigation">
                <button
                  className="nav-btn"
                  onClick={() => handleLowStockNavigation('prev')}
                  disabled={currentLowStockSection === 0}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className="audit-section-title">
                  {lowStockSections[currentLowStockSection]}
                </span>
                <button
                  className="nav-btn"
                  onClick={() => handleLowStockNavigation('next')}
                  disabled={currentLowStockSection === lowStockSections.length - 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Items</th>
                    <th>In Stock</th>
                    <th>Last Restocked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentLowStockData().map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.inStock}</td>
                      <td>{item.lastRestocked}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(item.status),
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        >
                          {getStatusDisplay(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <LowStockModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            lowStockItems={lowStockItems} 
          />

          {/* Audit Report Section */}
          <BlockchainAuditReport />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
