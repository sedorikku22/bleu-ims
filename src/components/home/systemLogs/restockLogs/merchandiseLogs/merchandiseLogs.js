import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import AddMerchandiseModal from './modals/addMerchandiseLogsModal';
import ViewMerchandiseLogsModal from './modals/viewMerchandiseLogsModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./merchandiseLogs.css";
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

function MerchandiseLogsContent() {
    const [merchandiseRecords, setMerchandiseRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddMerchandiseModal, setShowAddMerchandiseModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedMerchandise, setSelectedMerchandise] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthToken = () => localStorage.getItem("authToken");

    const fetchMerchandiseBatches = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/merchandise-batches/`, {
                headers: {
                    "Authorization": `Bearer ${getAuthToken()}`,
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch merchandise batches");
            }

            const data = await response.json();

            const mapped = data.map(batch => ({
                id: batch.batch_id,
                Merchandise: batch.merchandise_name,
                Quantity: batch.quantity,
                Unit: batch.unit,
                BatchDate: batch.batch_date,
                RestockDate: formatDateTime(batch.restock_date),
                RestockDateRaw: batch.restock_date,
                LoggedBy: batch.logged_by,
                Status: batch.status,
                Notes: batch.notes || ""
            }));

            setMerchandiseRecords(mapped);
        } catch (error) {
            console.error("Error fetching merchandise batches:", error);
            toast.error("Failed to load merchandise batches.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMerchandiseBatches();
    }, []);

    const handleRowClick = (row) => {
        setSelectedMerchandise(row);
        setShowViewModal(true);
    };

    const filteredMerchandise = merchandiseRecords
        .filter(item => {
            const normalizedSearch = searchQuery.toLowerCase().trim();
            const matchesSearch = item.Merchandise.toLowerCase().includes(normalizedSearch);
            const matchesStatus = statusFilter === 'all' || item.Status === statusFilter;

            // date range filter
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
            // Prioritize low stock items first
            const isLowA = a.Status === "Low Stock";
            const isLowB = b.Status === "Low Stock";
            if (isLowA && !isLowB) return -1;
            if (!isLowA && isLowB) return 1;

            // Then sort by batch date (newest first)
            const dateA = new Date(a.BatchDate);
            const dateB = new Date(b.BatchDate);
            return dateB - dateA;
        });

    return (
        <>
            <div className="merchandise-logs-header">
                <div className="merchandise-logs-bottom-row">
                    <input
                        type="text"
                        className="merchandise-logs-search-box"
                        placeholder="Search Merchandise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.trimStart())}
                    />

                    {/* Status Filter */}
                    <div className="filter-merchandise-container">
                        <label htmlFor="filter-merchandise">Filter by Status:</label>
                        <select
                            id="filter-merchandise"
                            className="filter-merchandise-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="Available">Available</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Not Available">Not Available</option>
                            <option value="Used">Used</option>
                        </select>
                    </div>

                    {/* Date Range Filters */}
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
                            min={dateFrom}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="merchandise-logs-content">
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
                            { name: "Item Name", selector: row => row.Merchandise, sortable: true, width: "17%" },
                            {
                                name: "Quantity",
                                selector: row => `${row.Quantity}${row.Unit ? row.Unit : ""}`,
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
                                    else if (row.Status === "Low Stock") className = "status-low-stock";
                                    else if (row.Status === "Not Available") className = "status-not-available";
                                    else if (row.Status === "Used") className = "status-used";
                                    return <span className={className}>{row.Status}</span>;
                                }
                            },
                        ]}
                        data={filteredMerchandise}
                        striped
                        highlightOnHover
                        responsive
                        pagination
                        paginationPerPage={9}
                        paginationRowsPerPageOptions={[9,10,15,20]}
                        onRowClicked={handleRowClick}
                        pointerOnHover
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
                                    cursor: "pointer",
                                },
                            },
                        }}
                        noDataComponent={<div>No items found.</div>}
                    />
                )}
            </div>

            {showAddMerchandiseModal && (
                <AddMerchandiseModal
                    onClose={() => setShowAddMerchandiseModal(false)}
                    onSubmit={() => {}}
                />
            )}

            {showViewModal && (
                <ViewMerchandiseLogsModal
                    merchandise={selectedMerchandise}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedMerchandise(null);
                    }}
                />
            )}

            <ToastContainer />
        </>
    );
}

export default MerchandiseLogsContent;