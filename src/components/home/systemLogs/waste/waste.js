import React, { useState, useEffect } from "react";
import Sidebar from "../../../sidebar";
import Header from "../../../header";
import DataTable from "react-data-table-component";
import AddWasteModal from './modals/addWasteModal';
import ViewWasteModal from './modals/viewWasteModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./waste.css";
import loadingAnimation from "../../../../assets/animation/loading.webm";

function Waste() {
    const [wasteRecords, setWasteRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showAddWasteModal, setShowAddWasteModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [tempFormList, setTempFormList] = useState(null);
    const [selectedWaste, setSelectedWaste] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWasteData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("authToken");

            // urls
            const WASTE_URL = "http://127.0.0.1:8005/wastelogs/";
            const ING_URL = "http://127.0.0.1:8002/ingredients/";
            const ING_BATCH_URL = "http://127.0.0.1:8003/ingredient-batches/";
            const MAT_URL = "http://127.0.0.1:8002/materials/";
            const MAT_BATCH_URL = "http://127.0.0.1:8003/material-batches/";
            const MERCH_URL = "http://127.0.0.1:8002/merchandise/";
            const MERCH_BATCH_URL = "http://127.0.0.1:8003/merchandise-batches/";

            const headers = { Authorization: `Bearer ${token}` };

            // fetch all data 
            const [
                wasteRes, ingRes, ingBatchRes,
                matRes, matBatchRes,
                merchRes, merchBatchRes
            ] = await Promise.all([
                fetch(WASTE_URL, { headers }),
                fetch(ING_URL, { headers }),
                fetch(ING_BATCH_URL, { headers }),
                fetch(MAT_URL, { headers }),
                fetch(MAT_BATCH_URL, { headers }),
                fetch(MERCH_URL, { headers }),
                fetch(MERCH_BATCH_URL, { headers }),
            ]);

            if (
                !wasteRes.ok || !ingRes.ok || !ingBatchRes.ok ||
                !matRes.ok || !matBatchRes.ok ||
                !merchRes.ok || !merchBatchRes.ok
            ) {
                throw new Error("Failed to fetch data");
            }

            const [
                wastes, ingredients, ingBatches,
                materials, matBatches,
                merchandise, merchBatches
            ] = await Promise.all([
                wasteRes.json(), ingRes.json(), ingBatchRes.json(),
                matRes.json(), matBatchRes.json(),
                merchRes.json(), merchBatchRes.json()
            ]);

            // build maps
            const ingredientMap = Object.fromEntries(
                ingredients.map(item => [item.IngredientID || item.ingredient_id, item.IngredientName || item.ingredient_name])
            );
            const materialMap = Object.fromEntries(
                materials.map(item => [item.MaterialID || item.material_id, item.MaterialName || item.material_name])
            );
            const merchandiseMap = Object.fromEntries(
                merchandise.map(item => [item.MerchandiseID || item.merchandise_id, item.MerchandiseName || item.merchandise_name])
            );

            const mapped = wastes.map(log => {
                const type = log.ItemType.toLowerCase();
                const itemId = log.ItemID || log.item_id;
                let itemName = "Not Found";
                if (type === "ingredient") {
                    itemName = ingredientMap[itemId] || "Ingredient Not Found";
                } else if (type === "material") {
                    itemName = materialMap[itemId] || "Material Not Found";
                } else if (type === "merchandise") {
                    itemName = merchandiseMap[itemId] || "Merchandise Not Found";
                }

                let batchDate = log.BatchDate || log.batch_date || "-";
                if (batchDate && batchDate !== "-") {
                    batchDate = new Date(batchDate).toLocaleDateString();
                }

                return {
                    
                    ItemType: log.ItemType.charAt(0).toUpperCase() + log.ItemType.slice(1),
                    ItemName: itemName,
                    BatchDate: batchDate,
                    BatchDateRaw: log.BatchDate || log.batch_date || null,
                    Amount: log.Amount,
                    Unit: log.Unit,
                    Reason: log.WasteReason,
                    Date: new Date(log.WasteDate).toLocaleDateString(),
                    LoggedBy: log.LoggedBy,
                    Notes: log.Notes || ""
                };
            });
            setWasteRecords(mapped);
        } catch (error) {
            console.error("Error loading waste logs:", error);
            toast.error("Failed to load waste records.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchWasteData();
    }, []);

    const handleAddWasteSubmit = () => {
        fetchWasteData();  // reload data
        setShowAddWasteModal(false);
    };



    const filteredSortedWaste = wasteRecords
        .filter(item => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
                item.ItemType.toLowerCase().includes(query) ||
                item.ItemName.toLowerCase().includes(query);
            
            // date range filtering using BatchDate
            let matchesDateRange = true;
            if (dateFrom || dateTo) {
                if (item.BatchDateRaw && item.BatchDateRaw !== "-") {
                    const batchDate = new Date(item.BatchDateRaw);
                    if (dateFrom) {
                        const fromDate = new Date(dateFrom);
                        matchesDateRange = matchesDateRange && batchDate >= fromDate;
                    }
                    if (dateTo) {
                        const toDate = new Date(dateTo);
                        matchesDateRange = matchesDateRange && batchDate <= toDate;
                    }
                } else {
                    // If no batch date, exclude from date filtering
                    matchesDateRange = false;
                }
            }
            
            return matchesSearch && matchesDateRange;
        })
        .sort((a, b) => {
            const dateA = new Date(a.Date);
            const dateB = new Date(b.Date);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });


    return (
        <div className="waste">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Waste Management" />
                <div className="waste-header">
                    <div className="waste-bottom-row">
                        <input
                            type="text"
                            className="waste-search-box"
                            placeholder="Search Item Type or Item Name..."
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

                        <button className="add-waste-button" onClick={() => setShowAddWasteModal(true)}>
                            + Create Waste Log
                        </button>
                    </div>
                </div>
                <div className="waste-content">
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
                                { name: "Date", selector: row => row.Date, width: "9%", center: false },
                                { name: "Item Type", selector: row => row.ItemType, sortable: true, width: "12%", center: true },
                                { name: "Item Name", selector: row => row.ItemName, width: "22%", center: true },
                                { name: "Batch Date", selector: row => row.BatchDate, width: "12%", center: true },
                                { 
                                    name: "Amount", 
                                    selector: row => `${row.Amount} ${row.Unit ? row.Unit : ""}`, 
                                    width: "12%", 
                                    center: true,
                                    cell: (row) => (
                                        <span>{`${row.Amount} ${row.Unit ? row.Unit : ""}`}</span>
                                    )
                                },
                                { name: "Reason", selector: row => row.Reason, width: "18%", center: true },
                                { name: "Logged By", selector: row => row.LoggedBy, width: "15%", center: false },
                            ]}
                            data={filteredSortedWaste}
                            onRowClicked={(row) => setSelectedWaste(row)}
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
            </div>

            {showAddWasteModal && (
                <AddWasteModal
                    onClose={() => setShowAddWasteModal(false)}
                    onSubmit={handleAddWasteSubmit}
                    initialFormData={tempFormList}
                />
            )}

            {selectedWaste && (
                <ViewWasteModal
                    waste={selectedWaste}
                    onClose={() => setSelectedWaste(null)}
                />
            )}

            <ToastContainer />
        </div>
    );
}

export default Waste;