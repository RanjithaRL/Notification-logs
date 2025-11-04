// This is an example of a Node.js Express server to provide the backend API.
// To run this, you would need to have Node.js installed and run the following commands in your terminal:
//
// 1. Initialize a new Node.js project:
//    npm init -y
//
// 2. Install required dependencies:
//    npm install express pg cors dotenv
//
// 3. Create a file named .env in the same directory and add your PostgreSQL connection string:
//    DATABASE_URL=postgres://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE
//
// 4. Start the server:
//    node backend-server.js
//
// The server will then be running at http://localhost:3001

import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const app = express();
const port = 3001; // Port for the backend server

// Use CORS to allow requests from the frontend (which runs on a different port)
app.use(cors());
app.use(express.json());

// Setup PostgreSQL connection pool
// The Pool will use the DATABASE_URL from the .env file
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Use SSL if required by your database provider (e.g., Heroku, AWS RDS, DigitalOcean)
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('[Server] Database connection pool created.');
} else {
  console.log('[Server] No DATABASE_URL found. Will use mock data.');
}

// API endpoint to get notification summary for a date range
app.get('/api/notifications/summary', async (req, res) => {
  console.log(`[Server] Received request at ${new Date().toISOString()}`);
  const { startDate, endDate } = req.query;
  
  // Default to today's date if parameters are not provided
  const today = new Date().toISOString().split('T')[0];
  const start = startDate || today;
  const end = endDate || today;
  console.log(`[Server] Using date range: ${start} to ${end}`);

  // This query fetches the raw logs. The aggregation is done in the backend code.
  const query = `
    SELECT 
        * 
    FROM 
        notification.logs nl
    WHERE 
        nl.event_type IN ('payment-reminder-job', 'session-reminder')
        AND nl.notification_type IN ('push', 'whatsapp')
        AND DATE(nl.created_at) BETWEEN $1 AND $2;
  `;

  try {
    if (!pool) {
      // Return mock data if no database connection
      console.log('[Server] Using mock data (no database connection).');
      const mockCounts = {
        'payment-reminder-job': { 
          total: Math.floor(Math.random() * 500) + 300, 
          push: Math.floor(Math.random() * 300) + 200,
          whatsapp: Math.floor(Math.random() * 200) + 100
        },
        'session-reminder': { 
          total: Math.floor(Math.random() * 800) + 500,
          push: Math.floor(Math.random() * 600) + 400,
          whatsapp: Math.floor(Math.random() * 300) + 200
        },
      };

      const summary = [
        { trigger: 'payment-reminder-job', count: mockCounts['payment-reminder-job'].total },
        { trigger: 'session-reminder', count: mockCounts['session-reminder'].total },
      ];

      const breakdown = {
        paymentReminder: [
          { trigger: 'push', count: mockCounts['payment-reminder-job'].push },
          { trigger: 'whatsapp', count: mockCounts['payment-reminder-job'].whatsapp },
        ],
        sessionReminder: [
          { trigger: 'push', count: mockCounts['session-reminder'].push },
          { trigger: 'whatsapp', count: mockCounts['session-reminder'].whatsapp },
        ],
      };

      const responseData = {
        dateRange: { start, end },
        summary: summary,
        breakdown: breakdown,
      };
      console.log('[Server] Sending mock JSON response to client.');
      return res.json(responseData);
    }

    console.log('[Server] Executing database query...');
    const { rows } = await pool.query(query, [start, end]);
    console.log(`[Server] Database query returned ${rows.length} rows.`);

    // Process the raw logs to get counts
    const counts = {
      'payment-reminder-job': { total: 0, push: 0, whatsapp: 0 },
      'session-reminder': { total: 0, push: 0, whatsapp: 0 },
    };

    for (const row of rows) {
      if (counts[row.event_type]) {
          counts[row.event_type].total++;
          if (row.notification_type === 'push' || row.notification_type === 'whatsapp') {
              counts[row.event_type][row.notification_type]++;
          }
      }
    }
    console.log('[Server] Processed raw data into counts:', counts);

    // Format for the main summary chart
    const summary = [
      { trigger: 'payment-reminder-job', count: counts['payment-reminder-job'].total },
      { trigger: 'session-reminder', count: counts['session-reminder'].total },
    ];

    // Format for the breakdown charts
    const breakdown = {
      paymentReminder: [
        { trigger: 'push', count: counts['payment-reminder-job'].push },
        { trigger: 'whatsapp', count: counts['payment-reminder-job'].whatsapp },
      ],
      sessionReminder: [
        { trigger: 'push', count: counts['session-reminder'].push },
        { trigger: 'whatsapp', count: counts['session-reminder'].whatsapp },
      ],
    };

    const responseData = {
      dateRange: { start, end },
      summary: summary,
      breakdown: breakdown,
    };
    console.log('[Server] Sending final JSON response to client.');
    res.json(responseData);
  } catch (error) {
    console.error('[Server] Error executing query', error.stack);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`[Server] Backend server running at http://localhost:${port}`);
});
