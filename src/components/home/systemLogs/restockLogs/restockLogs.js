import React, { useState, useEffect } from 'react';
import Sidebar from '../../../sidebar';
import Header from '../../../header';
import IngredientsLogsContent from '../restockLogs/ingredientsLogs/ingredientsLogs';
import SuppliesLogsContent from '../restockLogs/suppliesLogs/suppliesLogs';
import MerchandiseLogsContent from '../restockLogs/merchandiseLogs/merchandiseLogs';
import './restockLogs.css';

function RestockLogs() {
    const [activeTab, setActiveTab] = useState('Ingredients');

    const tabs = [
        { name: 'Ingredients', component: IngredientsLogsContent },
        { name: 'Supplies', component: SuppliesLogsContent },
        { name: 'Merchandise', component: MerchandiseLogsContent }
    ];

    const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component;

    return (
        <div className="restockLogs">
            <Sidebar />
            <div className="roles">
                <Header pageTitle="Restock Logs" />

                <div className="restockLogs-header">
                    <div className="restockLogs-top-row">
                        {tabs.map(tab => (
                            <button
                                key={tab.name}
                                className={`restockLogs-tab-button ${activeTab === tab.name ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.name)}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="restockLogs-content">
                    {ActiveComponent && <ActiveComponent />}
                </div>
            </div>
        </div>
    );
}

export default RestockLogs;
