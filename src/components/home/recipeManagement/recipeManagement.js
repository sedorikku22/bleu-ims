import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import "./recipeManagement.css";
import Sidebar from "../../sidebar";
import { FaChevronDown, FaBell, FaFolderOpen, FaEdit, FaArchive } from "react-icons/fa";
import DataTable from "react-data-table-component";
import AddRecipeModal from "./modals/addRecipeModal";
import EditRecipeModal from "./modals/editRecipeModal";
import ViewRecipeModal from "./modals/viewRecipeModal";
import ManageAddOnsModal from "./modals/manageAddOnsModal";
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert'; 
import "../../reactConfirmAlert.css";
import loadingAnimation from "../../../assets/animation/loading.webm";

const RECIPE_API_URL = "https://ims-recipeservices.onrender.com/recipes/";
const PRODUCTS_API_URL = "https://ims-productservices.onrender.com/is_products/products/";
const INGREDIENTS_API_URL = "https://bleu-stockservices.onrender.com/ingredients/";
const SUPPLIES_API_URL = "https://bleu-stockservices.onrender.com/materials/";
const PRODUCT_TYPES_API_URL = "https://ims-productservices.onrender.com1/ProductType/";

const getAuthToken = () => localStorage.getItem("authToken");

const CATEGORY_OPTIONS = {
    'Drinks': [
        'Barista Choice',
        'Frappe',
        'Milktea',
        'Non-Coffee',
        'Premium Coffee',
        'Sparkling Series',
        'Specialty Coffee'
    ],
    'Food': [
        'Pasta',
        'Rice Meals',
        'Sandwich',
        'Silog Bowls',
        'Snacks'
    ],
    'Foods': [
        'Pasta',
        'Rice Meals',
        'Sandwich',
        'Silog Bowls',
        'Snacks'
    ],
    'Milktea': [
        'Barista Choice',
        'Frappe',
        'Milktea',
        'Non-Coffee',
        'Premium Coffee',
        'Sparkling Series',
        'Specialty Coffee'
    ]
};

function RecipeManagement() {
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const isStaff = loggedInUserDisplay.role?.toLowerCase() === 'staff';
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [supplies, setSupplies] = useState([]);
    const [productTypes, setProductTypes] = useState([]); 
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showManageAddOnsModal, setShowManageAddOnsModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const currentDate = new Date().toLocaleString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
    });

    const handleLogout = useCallback(() => { 
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('username'); 
        navigate('/'); }, [navigate]);
    useEffect(() => { 
        const token = getAuthToken(); 
        const storedUsername = localStorage.getItem("username"); 
        if (token && storedUsername) { 
            try { const decodedToken = jwtDecode(token); 
                setLoggedInUserDisplay({ name: storedUsername, role: decodedToken.role || "User" }); 
            } catch (error) { console.error("Failed to decode token:", error); handleLogout(); } 
        } else { navigate('/'); }
     }, [navigate, handleLogout]);

    const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    const token = getAuthToken();
    if (!token) return;

    try {
        const headers = {
        headers: { Authorization: `Bearer ${token}` }
        };

        const [recipesRes,productsRes,ingredientsRes,suppliesRes,typesRes] = await Promise.all([
        fetch(RECIPE_API_URL, headers),
        fetch(PRODUCTS_API_URL, headers),
        fetch(INGREDIENTS_API_URL, headers),
        fetch(SUPPLIES_API_URL, headers),
        fetch(PRODUCT_TYPES_API_URL, headers)
        ]);

        if (recipesRes.ok) {
        const recipes = await recipesRes.json();
        setRecipes(recipes);
        }

        if (productsRes.ok) {
        const products = await productsRes.json();
        setProducts(products);
        }

        if (ingredientsRes.ok) {
        const ingredients = await ingredientsRes.json();
        setIngredients(ingredients);
        }

        if (suppliesRes.ok) {
        const supplies = await suppliesRes.json();
        setSupplies(supplies);
        }

        if (typesRes.ok) {
        const types = await typesRes.json();
        setProductTypes(types);
        }
    } catch (error) {
        console.error("Error fetching application data:", error);
    }
    setIsLoading(false);
    }, []);

    useEffect(() => {
    refreshAllData();
    }, [refreshAllData]);

    useEffect(() => {
        if (!activeTab && productTypes.length > 0) {
            setActiveTab(productTypes[0].productTypeName); 
        }
    }, [productTypes, activeTab]);

    // reset category filter when tab changes
    useEffect(() => {
        setSelectedCategory('');
        setCurrentPage(1);
    }, [activeTab]);

    // reset page when search or category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const groupedRecipes = useMemo(() => {
        if (!Array.isArray(recipes) || !Array.isArray(products)) {
            return {};
        }
        const combinedData = recipes.map(recipe => {
            const product = products.find(
                p => String(p.ProductID) === String(recipe.ProductID)
            );
            if (!product) {
                console.warn(
                    `Could not find product with ID: ${recipe.ProductID} for recipe: ${recipe.RecipeName}`
                );
                return null;
            }
            return {
                id: recipe.RecipeID,
                name: recipe.RecipeName,
                description: product.ProductDescription,
                category: product.ProductCategory,
                productTypeName: product.ProductTypeName,
                fullRecipeData: recipe,
                fullProductData: product,
            };
        }).filter(Boolean);
        return combinedData.reduce((acc, recipe) => {
            const key = recipe.productTypeName;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(recipe);
            return acc;
        }, {});
    }, [recipes, products]);

    const currentCategories = useMemo(() => {
        if (!activeTab) return [];
        
        if (CATEGORY_OPTIONS[activeTab]) {
            return CATEGORY_OPTIONS[activeTab];
        }
        
        const normalizedTab = activeTab.toLowerCase();
        const matchingKey = Object.keys(CATEGORY_OPTIONS).find(
            key => key.toLowerCase() === normalizedTab
        );
        
        return matchingKey ? CATEGORY_OPTIONS[matchingKey] : [];
    }, [activeTab]);

    const filteredRecipes = useMemo(() => {
        let filtered = groupedRecipes[activeTab] || [];

        // Filter by category (if a category is selected)
        if (selectedCategory) {
            filtered = filtered.filter(recipe => recipe.category === selectedCategory);
        }

        // Apply search term filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim(); // Normalize and trim search term
            filtered = filtered.filter(recipe =>
                recipe.name.toLowerCase().trim().includes(term) ||
                recipe.description.toLowerCase().trim().includes(term)
            );
        }

        return filtered;
    }, [groupedRecipes, activeTab, selectedCategory, searchTerm]);

    const paginatedRecipes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredRecipes.slice(startIndex, endIndex);
    }, [filteredRecipes, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);

    const handleView = (recipe) => {
        const recipeWithDetails = {
            ...recipe.fullRecipeData,
            description: recipe.description,
            category: recipe.category,
        };
        setSelectedRecipe(recipeWithDetails);
        setShowViewModal(true);
    };

    const handleEdit = (recipe) => {
        if (isStaff ) {
            toast.warning("You do not have permission to edit.");
            return;
        }
        setSelectedRecipe(recipe.fullRecipeData);
        setShowEditModal(true);
    };

    const handleDelete = async (recipeId) => {
        confirmAlert({
            title: 'Confirm to delete',
            message: 'Are you sure you want to delete this item?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: async () => {
                        const token = getAuthToken();
                        try {
                            const response = await fetch(`${RECIPE_API_URL}${recipeId}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            });
                            if (response.ok) {
                                toast.success("Item deleted successfully.");
                                refreshAllData();
                            } else {
                                const errorData = await response.json();
                                toast.error(`Failed to delete item: ${errorData.detail || response.statusText}`);
                            }
                        } catch (error) {
                            console.error("Error while deleting item:", error);
                            toast.error("An error occurred while deleting the item.");
                        }
                    }
                },
                {
                    label: 'No',
                    onClick: () => {}
                }
            ]
        });
    };

    return (
        <div className="recipeManagement">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Product Composition Manager" />

                <div className="recipeManagement-header">
                     <div className="recipe-top-row">
                        {productTypes.map(type => (
                            <button
                                key={type.productTypeID} 
                                className={`recipe-tab-button ${activeTab === type.productTypeName ? "active" : ""}`} 
                                onClick={() => setActiveTab(type.productTypeName)} 
                            >
                                {type.productTypeName}
                            </button>
                        ))}
                    </div>
                    <div className="recipe-bottom-row">
                        <input 
                            type="text" 
                            className="search-box" 
                            placeholder="Search recipes..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                        />
                        
                        <div className="category-filter-container">
                            <select 
                                className="category-filter-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Filter by category</option>
                                {currentCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {!isStaff && (
                            <>
                                <button
                                    className="add-recipe-button"
                                    onClick={() => {
                                        if (isStaff) {
                                            toast.warning("You do not have permission to add recipes.");
                                            return;
                                        } setShowAddModal(true);
                                    }}
                                > + Create Recipe
                                </button>
                                <button
                                    className="add-addons-button" 
                                    onClick={() => setShowManageAddOnsModal(true)}
                                >
                                    Add-Ons
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="recipeManagement-content">
                    {isLoading ? (
                        <div className="loading-container">
                            <video
                                src={loadingAnimation}
                                autoPlay
                                loop
                                muted
                                className="loading-animation"
                            />
                        </div>
                    ) : (
                        <div className="recipe-grid">
                            {paginatedRecipes.length === 0 ? (
                                <div style={{ textAlign: "center", marginTop: "40px", fontSize: "1.1rem", color: "#555" }}>
                                    No items found.
                                </div>
                            ) : (
                                paginatedRecipes.map((recipe) => (
                                    <div key={recipe.id} className="recipe-card">
                                        <div className="recipe-card-header"><h3>{recipe.name}</h3><span className="recipe-category">{recipe.category}</span></div>
                                        <p className="recipe-description">{recipe.description}</p>
                                        <div className="recipe-actions">
                                            <button className="recipe-view-button" onClick={() => handleView(recipe)}>View Recipe</button>
                                            {!isStaff && (
                                                <>
                                                    <button className="recipe-edit-button" onClick={() => handleEdit(recipe)}>Edit</button>
                                                    <button className="recipe-delete-button" onClick={() => handleDelete(recipe.id)}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                
                {/* Pagination Controls */}
                {!isLoading && filteredRecipes.length > 0 && totalPages > 1 && (
                    <div className="pagination-container">
                        <button 
                            className="pagination-button"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <div className="pagination-info">
                            Page {currentPage} of {totalPages}
                        </div>
                        <button 
                            className="pagination-button"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
                
                {/* Add Recipe Modal */}
                {showAddModal && !isStaff && (
                    <AddRecipeModal
                        type={activeTab?.toLowerCase()}
                        onClose={() => setShowAddModal(false)}
                        onSubmit={refreshAllData}
                        products={products}
                        initialIngredients={ingredients}
                        supplies={supplies}
                    />
                )}
                
                {/* Edit Recipe Modal */}
                {showEditModal && !isStaff && selectedRecipe && (
                    <EditRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => setShowEditModal(false)}
                        onSuccess={() => {
                            setShowEditModal(false);
                            refreshAllData();
                        }}
                        products={products}
                        ingredients={ingredients}
                        supplies={supplies}
                    />
                )}
                
                {/* View Recipe Modal */}
                {showViewModal && selectedRecipe && (
                    <ViewRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => setShowViewModal(false)}
                        onEdit={!isStaff ? () => {
                            setShowViewModal(false);
                            handleEdit({ fullRecipeData: selectedRecipe });
                        } : undefined}
                    />
                )}
                
                {/* Manage Add-Ons Modal*/}
                {showManageAddOnsModal && (
                    <ManageAddOnsModal
                        onClose={() => setShowManageAddOnsModal(false)}
                    />
                )}
                
                <ToastContainer />
            </div>
        </div>
    );
}

export default RecipeManagement;