import { MetricData, StatusColor, Scenario } from '../types';

// The frontend now simply calls the Python Backend
const BACKEND_URL = 'http://localhost:5000/api/dashboard';

export const generateDashboardData = async (scenario: Scenario = Scenario.Normal): Promise<MetricData[]> => {
  try {
    const response = await fetch(BACKEND_URL);
    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.statusText}`);
    }
    const data: MetricData[] = await response.json();
    
    // Map backend string colors to Enum if necessary, though strings usually work fine in JS/TS if they match.
    // Ensure the shape matches exactly what UI expects.
    return data;
  } catch (error) {
    console.error("Failed to fetch from Python backend. Is app.py running?", error);
    
    // Fallback: Return empty array or throw, UI handles the error via loading state usually.
    // Or return a mock error state if desired.
    return [];
  }
};

