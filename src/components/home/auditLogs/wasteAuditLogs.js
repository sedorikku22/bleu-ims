import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import "./wasteAuditLogs.css";
import Sidebar from "../../sidebar";
import DataTable from "react-data-table-component";
import ViewWasteLogModal from './Modals/viewWasteLogModal';
import Header from "../../header";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loadingAnimation from "../../../assets/animation/loading.webm";

const API_BASE_URL = "https://ims-blockchain.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

function WasteAuditLogs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const [loggedInUserDisplay, setLoggedInUserDisplay] = useState({ role: "User", name: "Current User" });
    const [filterAction, setFilterAction] = useState("all");
    const [loading, setLoading] = useState(true);
    const [showViewLogModal, setShowViewLogModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

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
                console.error("Error decoding token:", error);
                handleLogout();
            }
        } else {
            console.log("No session found. Redirecting to login.");
            navigate('/');
        }
    }, [navigate, handleLogout]);

    const fetchLogs = useCallback(async () => {
        const token = getAuthToken();
        if (!token) {
            toast.error("Authentication token not found.");
            handleLogout();
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/blockchain/waste`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to fetch waste logs.");
            }

            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error("Error fetching waste logs:", error);
            toast.error("Failed to load waste logs.");
        }
        setLoading(false);
    }, [handleLogout]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredSortedLogs = logs
        .filter((item) => {
            const matchesSearch = (item.ItemType && item.ItemType.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.WasteReason && item.WasteReason.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.LoggedBy && item.LoggedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.user_id && item.user_id.toString().includes(searchQuery));
            const matchesAction = filterAction === "all" || item.action === filterAction;

            let matchesDateRange = true;
            if (dateFrom || dateTo) {
                const logDate = new Date(item.timestamp);
                logDate.setHours(0, 0, 0, 0);

                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    matchesDateRange = matchesDateRange && logDate >= fromDate;
                }

                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(0, 0, 0, 0);
                    matchesDateRange = matchesDateRange && logDate <= toDate;
                }
            }

            return matchesSearch && matchesAction && matchesDateRange;
        })
        .sort((a, b) => {
            const dateA = new Date(a.timestamp);
            const dateB = new Date(b.timestamp);
            return dateB - dateA;
        });

    const handleView = (log) => {
        setSelectedLog(log);
        setShowViewLogModal(true);
    };

    const columns = [
        { name: "TIMESTAMP",
        selector: (row) => {
            const formattedDate = new Date(row.timestamp).toLocaleString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
            return formattedDate.replace(",", "");
        },
        width: "12%",
        center: false,},
        { name: "USER", selector: (row) => row.user_id || "N/A", width: "8%", center: true },
        {
            name: "ACTION", selector: (row) => row.action, width: "10%", center: true,
            cell: (row) => {
                let className = "waste-action-other";
                if (row.action === "WASTE") className = "waste-action-waste";
                return <span className={className}>{row.action}</span>;
            }
        },
        { name: "ITEM TYPE", selector: (row) => row.ItemType, width: "12%", center: true },
        {
            name: "AMOUNT", selector: (row) => row.Amount, width: "10%", center: true,
            cell: (row) => <span>{row.Amount !== null ? parseFloat(row.Amount).toFixed(2) : 'N/A'}</span>
        },
        { name: "UNIT", selector: (row) => row.Unit || "N/A", width: "8%", center: true },
        { name: "WASTE REASON", selector: (row) => row.WasteReason || "N/A", width: "14%", center: true },
        { name: "WASTE DATE", selector: (row) => row.WasteDate || "N/A", width: "14%", center: true },
        { name: "LOGGED BY", selector: (row) => row.LoggedBy || "N/A", width: "12%", center: true },
    ];

    return (
        <div className="waste-audit-logs">
            <Sidebar />
            <div className="waste-roles">

                <Header pageTitle="Waste Audit Logs" />

                <div className="waste-audit-header">
                    <div className="waste-audit-bottom-row">
                        <input
                            type="text"
                            className="waste-audit-search-box"
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="waste-filter-audit-container">
                            <label htmlFor="waste-filter-audit">Filter by Action: </label>
                            <select
                                id="waste-filter-audit"
                                className="waste-filter-audit-select"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="WASTE">Waste</option>
                            </select>
                        </div>

                        <div className="waste-date-filter-container">
                            <label htmlFor="waste-date-from">From:</label>
                            <input
                                type="date"
                                id="waste-date-from"
                                className="waste-date-filter-input"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="waste-date-filter-container">
                            <label htmlFor="waste-date-to">To:</label>
                            <input
                                type="date"
                                id="waste-date-to"
                                className="waste-date-filter-input"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="waste-audit-content">
                    {loading ? (
                        <div className="waste-loading-container">
                            <video
                                src={loadingAnimation}
                                autoPlay
                                loop
                                muted
                                className="waste-loading-animation"
                            />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredSortedLogs}
                            striped
                            highlightOnHover
                            responsive
                            pagination
                            paginationPerPage={9}
                            paginationRowsPerPageOptions={[9, 10, 15, 20]}
                            onRowClicked={handleView}
                            customStyles={{
                                headCells: {
                                    style: {
                                        backgroundColor: "#4B929D",
                                        color: "#fff",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        padding: "12px",
                                        textTransform: "UPPERCASE",
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
                            noDataComponent={<div>No logs found.</div>}
                        />
                    )}
                </div>
            </div>

            {showViewLogModal && selectedLog && (
                <ViewWasteLogModal
                    log={selectedLog}
                    onClose={() => setShowViewLogModal(false)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default WasteAuditLogs;