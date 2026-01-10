import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import AddIngredientModal from './modals/addIngredientLogsModal';
import ViewIngredientLogsModal from './modals/viewIngredientLogsModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./ingredientsLogs.css";
import loadingAnimation from "../../../../../assets/animation/loading.webm";

function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

const API_BASE_URL = "https://ims-restockservices.onrender.comv";

function IngredientsLogsContent() {
    const [ingredientRecords, setIngredientRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    const fetchIngredientBatches = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ingredient-batches/`, {
                headers: {
                    "Authorization": `Bearer ${getAuthToken()}`,
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch ingredient batches");
            }

            const data = await response.json();

            const mapped = data.map(batch => ({
                id: batch.batch_id,
                Ingredient: batch.ingredient_name,
                Quantity: batch.quantity,
                Unit: batch.unit,
                BatchDate: batch.batch_date,
                BatchDateRaw: batch.batch_date,
                RestockDate: formatDateTime(batch.restock_date),
                RestockDateRaw: batch.restock_date,
                ExpirationDate: batch.expiration_date,
                LoggedBy: batch.logged_by,
                Status: batch.status,
                Notes: batch.notes || ""
            }));

            setIngredientRecords(mapped);
        } catch (error) {
            console.error("Error fetching ingredient batches:", error);
            toast.error("Failed to load ingredient batches.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchIngredientBatches();
    }, []);

    const filteredIngredients = ingredientRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();

            const matchesSearch = item.Ingredient.toLowerCase().includes(query) ||
                                 item.Status.toLowerCase().includes(query);

            let matchesDateRange = true;
            if (dateFrom || dateTo) {
                if (item.RestockDateRaw) {
                    const restockDate = new Date(item.RestockDateRaw);

                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        fromDate.setHours(0, 0, 0, 0);
                        matchesDateRange = matchesDateRange && restockDate >= fromDate;
                    }
                    if (dateTo) {
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);
                        matchesDateRange = matchesDateRange && restockDate <= toDate;
                    }
                } else {
                    matchesDateRange = false;
                }
            }

            return matchesSearch && matchesDateRange;
        })
        .sort((a, b) => {
            const aDate = a.RestockDateRaw ? new Date(a.RestockDateRaw) : (a.BatchDateRaw ? new Date(a.BatchDateRaw) : new Date(0));
            const bDate = b.RestockDateRaw ? new Date(b.RestockDateRaw) : (b.BatchDateRaw ? new Date(b.BatchDateRaw) : new Date(0));
            return bDate - aDate;
        });

    return (
        <>
            <div className="ingredients-logs-header">
                <div className="ingredients-logs-bottom-row">
                    <input
                        type="text"
                        className="ingredients-logs-search-box"
                        placeholder="Search Ingredient..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />

                    <div className="date-filter-container">
                        <label htmlFor="date-from">From:</label>
                        <input
                            type="date"
                            id="date-from"
                            className="date-filter-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-container">
                        <label htmlFor="date-to">To:</label>
                        <input
                            type="date"
                            id="date-to"
                            className="date-filter-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="ingredients-logs-content">
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
                    <DataTable
                        columns={[
                            { name: "Restock Date", selector: row => row.RestockDate, width: "15%", center: false },
                            { name: "Item Name", selector: row => row.Ingredient, sortable: true, width: "15%" },
                            {
                                name: "Amount",
                                selector: row => `${row.Quantity} ${row.Unit ? row.Unit : ""}`,
                                width: "12.5%",
                                center: true,
                                cell: (row) => (
                                    <span>{`${row.Quantity} ${row.Unit ? row.Unit : ""}`}</span>
                                )
                            },
                            { name: "Batch Date", selector: row => row.BatchDate, width: "15%", center: true },
                            { name: "Expiration Date", selector: row => row.ExpirationDate, width: "14%", center: true },
                            { name: "Logged By", selector: row => row.LoggedBy, width: "15%", center: true },
                            {
                                name: "Status",
                                selector: row => row.Status,
                                width: "13.5%",
                                center: true,
                                cell: (row) => {
                                    let className = "";
                                    if (row.Status === "Available") className = "status-available";
                                    else if (row.Status === "Used") className = "status-used";
                                    else if (row.Status === "Expired") className = "status-expired";
                                    return <span className={className}>{row.Status}</span>;
                                }
                            },

                        ]}
                        data={filteredIngredients}
                        onRowClicked={(row) => setSelectedIngredient(row)}
                        striped
                        highlightOnHover
                        responsive
                        pagination
                        paginationPerPage={9}
                        paginationRowsPerPageOptions={[9,10,15,20]}
                        customStyles={{
                            headCells: {
                                style: {
                                    backgroundColor: "#4B929D",
                                    color: "#fff",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    padding: "12px",
                                    textTransform: "uppercase",
                                    textAlign: "center",
                                    letterSpacing: "1px",
                                },
                            },
                            rows: {
                                style: {
                                    minHeight: "55px",
                                },
                            },
                        }}
                        noDataComponent={<div>No items found.</div>}
                    />
                )}
            </div>

            {showAddIngredientModal && (
                <AddIngredientModal
                    onClose={() => setShowAddIngredientModal(false)}
                    onSubmit={() => {}}
                />
            )}

            {selectedIngredient && (
                <ViewIngredientLogsModal
                    ingredient={selectedIngredient}
                    onClose={() => setSelectedIngredient(null)}
                />
            )}

            <ToastContainer />
        </>
    );
}

export default IngredientsLogsContent;
