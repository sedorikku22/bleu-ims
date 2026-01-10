import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import AddSuppliesModal from './modals/addSuppliesLogsModal';
import ViewSuppliesLogsModal from './modals/viewSuppliesLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./suppliesLogs.css";
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

const API_BASE_URL = "https://ims-restockservices.onrender.com";

function SuppliesLogsContent() {
    const [suppliesRecords, setSuppliesRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddSuppliesModal, setShowAddSuppliesModal] = useState(false);
    const [selectedSupplies, setSelectedSupplies] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    const fetchMaterialBatches = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/material-batches/`, {
                headers: {
                    "Authorization": `Bearer ${getAuthToken()}`,
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch material batches");
            }

            const data = await response.json();

            const mapped = data.map(batch => ({
                id: batch.batch_id,
                Material: batch.material_name,
                Quantity: batch.quantity,
                Unit: batch.unit,
                BatchDate: batch.batch_date,
                RestockDate: formatDateTime(batch.restock_date),
                RestockDateRaw: batch.restock_date,
                LoggedBy: batch.logged_by,
                Status: batch.status,
                Notes: batch.notes || ""
            }));

            setSuppliesRecords(mapped);
        } catch (error) {
            console.error("Error fetching material batches:", error);
            toast.error("Failed to load material batches.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMaterialBatches();
    }, []);

    const filteredSupplies = suppliesRecords
        .filter(item => {
            const matchesSearch = item.Material.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.Status === statusFilter;

            let matchesDateRange = true;
            if (dateFrom || dateTo) {
                const batchDate = new Date(item.BatchDate);

                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    matchesDateRange = matchesDateRange && batchDate >= fromDate;
                }

                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    matchesDateRange = matchesDateRange && batchDate <= toDate;
                }
            }

            return matchesSearch && matchesStatus && matchesDateRange;
        })
        .sort((a, b) => {
            const dateA = new Date(a.BatchDate);
            const dateB = new Date(b.BatchDate);
            return dateB - dateA;
        });

    return (
        <>
            <div className="supplies-logs-header">
                <div className="supplies-logs-bottom-row">
                    <input
                        type="text"
                        className="supplies-logs-search-box"
                        placeholder="Search Supplies..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />

                    <div className="filter-supplies-container">
                        <label htmlFor="filter-supplies">Filter by Status:</label>
                        <select
                            id="filter-supplies"
                            className="filter-supplies-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="Available">Available</option>
                            <option value="Used">Used</option>
                        </select>
                    </div>

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
            <div className="supplies-logs-content">
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
                            { name: "Restock Date", selector: row => row.RestockDate, width: "17%", center: false },
                            { name: "Item Name", selector: row => row.Material, sortable: true, width: "17%" },
                            {
                                name: "Quantity",
                                selector: row => `${row.Quantity} ${row.Unit ? row.Unit : ""}`,
                                width: "17%",
                                center: true,
                                cell: (row) => (
                                    <span>{`${row.Quantity} ${row.Unit ? row.Unit : ""}`}</span>
                                )
                            },
                            { name: "Batch Date", selector: row => row.BatchDate, width: "17%", center: true },
                            { name: "Logged By", selector: row => row.LoggedBy, width: "17%", center: true },
                            {
                            name: "Status",
                            selector: row => row.Status,
                            width: "15%",
                            center: true,
                            cell: (row) => {
                                let className = "";
                                if (row.Status === "Available") className = "status-available";
                                else if (row.Status === "Used") className = "status-used";
                                return <span className={className}>{row.Status}</span>;
                            }
                            },

                        ]}
                        data={filteredSupplies}
                        onRowClicked={(row) => setSelectedSupplies(row)}
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

            {showAddSuppliesModal && (
                <AddSuppliesModal
                    onClose={() => setShowAddSuppliesModal(false)}
                    onSubmit={() => {}}
                />
            )}

            {selectedSupplies && (
                <ViewSuppliesLogsModal
                    supplies={selectedSupplies}
                    onClose={() => setSelectedSupplies(null)}
                />
            )}

            <ToastContainer />
        </>
    );
}

export default SuppliesLogsContent;
