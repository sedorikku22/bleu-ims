import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./auditLogs.css";
import ProductsAuditLogs from './productsAuditLogs';
import ViewProductLogModal from './Modals/viewProductLogModal';
import ProductTypeAuditLogs from "./productTypeAuditLogs";
import ViewProductTypeLogModal from './Modals/viewProductTypeLogModal';
import Sidebar from "../../sidebar";
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
    Package, 
    Carrot, 
    ShoppingBag, 
    Trash2, 
    ChefHat, 
    Box, 
    RefreshCw 
} from 'lucide-react';

const getAuthToken = () => localStorage.getItem("authToken");

function AuditLogs() {
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const [expandedCards, setExpandedCards] = useState({});
    const navigate = useNavigate();

    const handleLogout = useCallback(() => { 
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('username'); 
        navigate('/'); 
    }, [navigate]);

    useEffect(() => { 
        const token = getAuthToken(); 
        const storedUsername = localStorage.getItem("username"); 
        if (token && storedUsername) { 
            try { 
                const decodedToken = jwtDecode(token); 
                setLoggedInUserDisplay({ 
                    name: storedUsername, 
                    role: decodedToken.role || "User" 
                }); 
            } catch (error) { 
                console.error("Failed to decode token:", error); 
                handleLogout(); 
            } 
        } else { 
            navigate('/'); 
        }
    }, [navigate, handleLogout]);

    const categoryIcons = {
        products: Package,
        ingredients: Carrot,
        merchandise: ShoppingBag,
        waste: Trash2,
        recipe: ChefHat,
        materials: Box,
        restock: RefreshCw
    };

    const leftColumnCategories = [
        {
            id: 'products',
            title: 'Menu Management',
            hasSub: true,
            subTitle: 'Product Type',
            route: '/audit-logs/products',
            description: 'Track product changes and updates'
        },
        {
            id: 'ingredients',
            title: 'Ingredients',
            hasSub: false,
            route: '/audit-logs/ingredients',
            description: 'Monitor ingredient inventory'
        },
        {
            id: 'merchandise',
            title: 'Merchandise',
            hasSub: false,
            route: '/audit-logs/merchandise',
            description: 'View merchandise activity'
        },
        {
            id: 'waste',
            title: 'Waste',
            hasSub: false,
            route: '/audit-logs/waste',
            description: 'Track waste records'
        }
    ];

    const rightColumnCategories = [
        {
            id: 'recipe',
            title: 'Products Composition',
            hasSub: true,
            subTitle: 'Add-Ons',
            route: '/audit-logs/recipe',
            description: 'Review recipe modifications'
        },
        {
            id: 'materials',
            title: 'Supplies & Materials',
            hasSub: false,
            route: '/audit-logs/materials',
            description: 'Monitor materials usage'
        },
        {
            id: 'restock',
            title: 'Restock',
            hasSub: false,
            route: '/audit-logs/restock',
            description: 'View restock history'
        }
    ];

    const handleCardClick = (category) => {
        if (category.hasSub) {
            setExpandedCards(prev => ({
                ...prev,
                [category.id]: !prev[category.id]
            }));
        } else {
            navigate(category.route);
        }
    };

    const handleSubClick = (e, subRoute) => {
        e.stopPropagation();
        const subRoutePath = subRoute === 'Product Type' 
            ? '/audit-logs/product-type' 
            : '/audit-logs/add-ons';
        navigate(subRoutePath);
    };

    const handleMainCategoryClick = (e, route) => {
        e.stopPropagation();
        navigate(route);
    };

    const renderCard = (category) => {
        const IconComponent = categoryIcons[category.id];
        
        return (
            <div 
                key={category.id} 
                className={`audit-card ${expandedCards[category.id] ? 'expanded' : ''}`}
                onClick={() => handleCardClick(category)}
            >
                <div className="audit-card-header">
                    <div className="audit-card-title-section">
                        <IconComponent className="audit-card-icon" size={24} />
                        <h3>{category.title}</h3>
                    </div>
                    {category.hasSub && (
                        <span className={`expand-icon ${expandedCards[category.id] ? 'expanded' : ''}`}>
                            ▼
                        </span>
                    )}
                </div>
                {!expandedCards[category.id] && (
                    <p className="audit-card-description">{category.description}</p>
                )}
                {category.hasSub && expandedCards[category.id] && (
                    <div className="audit-sub-section">
                        <button 
                            className="audit-main-button"
                            onClick={(e) => handleMainCategoryClick(e, category.route)}
                        >
                            View {category.title}
                        </button>
                        <button 
                            className="audit-sub-button"
                            onClick={(e) => handleSubClick(e, category.subTitle)}
                        >
                            <span className="sub-icon">→</span>
                            {category.subTitle}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="auditLogs">
            <Sidebar />
            <div className="audit-roles">
                <Header pageTitle="Audit Logs" />
                <div className="audit-intro">
                    
                </div>

                <div className="auditLogs-content">
                    <div className="audit-grid">
                        <div className="audit-column">
                            {leftColumnCategories.map(renderCard)}
                        </div>
                        <div className="audit-column">
                            {rightColumnCategories.map(renderCard)}
                        </div>
                    </div>
                </div>
                
                <ToastContainer />
            </div>
        </div>
    );
}

export default AuditLogs;