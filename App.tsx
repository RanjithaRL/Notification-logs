import React, { useState, useEffect } from 'react';
import Card from './components/Card';
import CodeBlock from './components/CodeBlock';
import NotificationChart from './components/NotificationChart';

const mainQuery = `SELECT 
    * 
FROM 
    notification.logs nl
WHERE 
    nl.event_type IN ('payment-reminder-job', 'session-reminder')
    AND DATE(nl.created_at) BETWEEN $1 AND $2;
-- Note: The backend executes this query with safe parameters.
-- It then processes the raw logs to calculate the final counts.`;

const hourlyQuery = `SELECT
    date_trunc('hour', created_at) AS hour,
    trigger,
    count(*) AS total_notifications
FROM
    notification.logs
WHERE
    trigger IN ('payment-reminder-job', 'session-reminder')
    AND created_at >= current_date
    AND created_at < current_date + interval '1 day'
GROUP BY
    hour,
    trigger
ORDER BY
    hour,
    trigger;`;

const statusQuery = `SELECT
    trigger,
    status,
    count(*) AS total_notifications
FROM
    notification.logs
WHERE
    trigger IN ('payment-reminder-job', 'session-reminder')
    AND created_at >= current_date
    AND created_at < current_date + interval '1 day'
GROUP BY
    trigger,
    status
ORDER BY
    trigger,
    status;`;

// Define the structure for our API response data
interface ChartData {
  trigger: string;
  count: number;
}

interface BreakdownData {
  paymentReminder: ChartData[];
  sessionReminder: ChartData[];
}

interface ApiResponse {
  dateRange: {
    start: string;
    end: string;
  };
  summary: ChartData[];
  breakdown: BreakdownData;
}


const App: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);

  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (start: string, end: string) => {
    console.log(`[App.tsx] Starting fetchData for range: ${start} to ${end}`);
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ startDate: start, endDate: end });
      const response = await fetch(`http://localhost:3001/api/notifications/summary?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('[App.tsx] Successfully fetched data from backend:', data);
      setApiResponse(data);
    } catch (err: any) {
      setError(err.message);
      console.error("[App.tsx] Failed to fetch from backend, falling back to mock data.", err);
      const mockData = {
        dateRange: { start, end },
        summary: [
          { trigger: "payment-reminder-job", count: 1250 },
          { trigger: "session-reminder", count: 2800 }
        ],
        breakdown: {
          paymentReminder: [
            { trigger: "push", count: 800 },
            { trigger: "whatsapp", count: 450 }
          ],
          sessionReminder: [
            { trigger: "push", count: 2100 },
            { trigger: "whatsapp", count: 700 }
          ]
        }
      };
      console.log('[App.tsx] Using mock data as a fallback:', mockData);
      setApiResponse(mockData);
    } finally {
      setIsLoading(false);
      console.log('[App.tsx] fetchData finished.');
    }
  };

  useEffect(() => {
    // Fetch data for the default date range (today) on initial load
    fetchData(startDate, endDate);
  }, []);

  const handleFilterApply = () => {
    fetchData(startDate, endDate);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    fetchData(startStr, endStr);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Notification Logs Dashboard</h1>
          <p className="text-lg text-gray-400">Visualizing Notification Trigger Counts by Date Range</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <Card title="📊 Notification Summary">
               <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button
                            onClick={() => handleQuickSelect(0)}
                            className="px-4 py-2 bg-gray-700 text-gray-100 text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleQuickSelect(1)}
                            className="px-4 py-2 bg-gray-700 text-gray-100 text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Yesterday
                        </button>
                        <button
                            onClick={() => handleQuickSelect(7)}
                            className="px-4 py-2 bg-gray-700 text-gray-100 text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Last 7 Days
                        </button>
                        <button
                            onClick={() => handleQuickSelect(30)}
                            className="px-4 py-2 bg-gray-700 text-gray-100 text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Last 30 Days
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                            />
                        </div>
                        <button
                            onClick={handleFilterApply}
                            disabled={isLoading}
                            className="w-full sm:w-auto self-end px-6 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Loading...' : 'Apply Filter'}
                        </button>
                    </div>
                </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-[300px]">
                  <p>Loading chart data from backend...</p>
                </div>
              ) : error ? (
                 <div className="flex flex-col justify-center items-center h-[300px] text-center">
                    <p className="font-semibold text-red-400">Error loading data from backend.</p>
                    <p className="text-sm text-gray-400 mt-1">Displaying mock data as a fallback.</p>
                    {apiResponse && <NotificationChart data={apiResponse.summary} />}
                 </div>
              ) : apiResponse && apiResponse.summary.length > 0 ? (
                <NotificationChart data={apiResponse.summary} />
              ) : (
                <div className="flex justify-center items-center h-[300px]">
                  <p>No notification data found for the selected date range.</p>
                </div>
              )}
            </Card>
          </div>
          
          {apiResponse && apiResponse.breakdown && (
             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Payment Reminder Breakdown">
                    <NotificationChart data={apiResponse.breakdown.paymentReminder} />
                </Card>
                <Card title="Session Reminder Breakdown">
                    <NotificationChart data={apiResponse.breakdown.sessionReminder} />
                </Card>
             </div>
          )}


          <Card title="🚀 Main Query: Daily Counts">
            <p className="mb-4 text-gray-300">This parameterized query is executed on the backend to fetch raw logs for the selected date range. The server then aggregates this data.</p>
            <CodeBlock code={mainQuery} language="sql" />
          </Card>

          <Card title="📦 API Response Example">
             <p className="mb-4 text-gray-300">A simple JSON structure consumed by the front-end. The data below is fetched live from the backend (or is mock data if the fetch fails).</p>
             {isLoading ? <p>Loading API response...</p> : 
                <CodeBlock code={JSON.stringify(apiResponse, null, 2)} language="json" />
             }
          </Card>

          <div className="lg:col-span-2">
            <Card title="🔍 Extended Queries: Deeper Insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Group by Hour</h3>
                  <p className="mb-4 text-gray-300">Track notification volume throughout the day.</p>
                  <CodeBlock code={hourlyQuery} language="sql" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Group by Status</h3>
                  <p className="mb-4 text-gray-300">Analyze the success rate of notifications.</p>
                  <CodeBlock code={statusQuery} language="sql" />
                </div>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card title="🔌 Backend Server Example">
                <p className="mb-4 text-gray-300">The frontend fetches data from a simple Node.js/Express backend. You can find the example code for the server in <code className="bg-gray-700 p-1 rounded-md text-amber-300">backend-server.js</code>. To run it, you'll need to set up a Node.js environment, install dependencies (<code className="bg-gray-700 p-1 rounded-md text-amber-300">express</code>, <code className="bg-gray-700 p-1 rounded-md text-amber-300">pg</code>, <code className="bg-gray-700 p-1 rounded-md text-amber-300">cors</code>, <code className="bg-gray-700 p-1 rounded-md text-amber-300">dotenv</code>), and provide your database connection string in a <code className="bg-gray-700 p-1 rounded-md text-amber-300">.env</code> file.</p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;