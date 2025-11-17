// Labor Estimator API - Integrated with VehicleDatabases
// Returns labor hour estimates and repair pricing for auto repair shops

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { year, make, model, job_code, job_name, shop_rate } = req.body;

    // Validate required fields
    if (!year || !make || !model || !job_code || !shop_rate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: year, make, model, job_code, shop_rate'
      });
    }

    // Get API key from environment variable
    const apiKey = process.env.VEHICLE_DB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        status: 'error',
        message: 'API key not configured'
      });
    }

    // Call VehicleDatabases Repairs API
    // Using YMM (Year/Make/Model) endpoint
    const apiUrl = `https://api.vehicledatabases.com/v1/repairs-ymm/${year}/${encodeURIComponent(make)}/${encodeURIComponent(model)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-AuthKey': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // If API call fails, return mock data as fallback
      console.error('VehicleDatabases API error:', response.status);
      return returnMockData(year, make, model, job_code, job_name, shop_rate, res);
    }

    const repairData = await response.json();
    
    // Parse the repair data and find matching job
    if (repairData.status === 'success' && repairData.data) {
      const repairs = repairData.data.repairs || [];
      
      // Find the specific repair job by code
      const matchingRepair = repairs.find(r => 
        r.value === job_code || r.title.toLowerCase().includes(job_code.toLowerCase())
      );

      if (matchingRepair && matchingRepair.costs) {
        const partsCost = matchingRepair.costs.find(c => c.name === 'Parts');
        const laborCost = matchingRepair.costs.find(c => c.name === 'Labor');

        if (laborCost) {
          const laborHoursMin = (laborCost.low || 0) / 100; // Assuming $100/hour standard
          const laborHoursMax = (laborCost.high || 0) / 100;
          const laborHoursRecommended = (laborHoursMin + laborHoursMax) / 2;

          const suggestedLaborPrice = laborHoursRecommended * shop_rate;
          const partsEstimate = partsCost ? ((partsCost.low + partsCost.high) / 2) : 0;
          const totalEstimate = suggestedLaborPrice + partsEstimate;

          return res.status(200).json({
            status: 'success',
            job_code,
            job_name: matchingRepair.title,
            year,
            make,
            model,
            labor_hours_min: laborHoursMin.toFixed(2),
            labor_hours_max: laborHoursMax.toFixed(2),
            labor_hours_recommended: laborHoursRecommended.toFixed(2),
            shop_rate,
            suggested_labor_price: suggestedLaborPrice.toFixed(2),
            parts_cost_estimate: partsEstimate.toFixed(2),
            total_estimate: totalEstimate.toFixed(2),
            data_source: 'VehicleDatabases'
          });
        }
      }
    }

    // If no matching repair found, return mock data as fallback
    return returnMockData(year, make, model, job_code, job_name, shop_rate, res);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

// Fallback function for mock data
function returnMockData(year, make, model, job_code, job_name, shop_rate, res) {
  // Mock labor data (used as fallback when API unavailable)
  const mockLaborHours = {
    min: 1.2,
    max: 1.8,
    recommended: 1.5
  };

  const mockPartsCost = 180;
  const suggestedLaborPrice = mockLaborHours.recommended * shop_rate;
  const totalEstimate = suggestedLaborPrice + mockPartsCost;

  return res.status(200).json({
    status: 'success',
    job_code,
    job_name: job_name || 'Repair Service',
    year,
    make,
    model,
    labor_hours_min: mockLaborHours.min,
    labor_hours_max: mockLaborHours.max,
    labor_hours_recommended: mockLaborHours.recommended,
    shop_rate,
    suggested_labor_price: suggestedLaborPrice.toFixed(2),
    parts_cost_estimate: mockPartsCost.toFixed(2),
    total_estimate: totalEstimate.toFixed(2),
    data_source: 'mock_fallback',
    note: 'Using estimated data. Connect to VehicleDatabases API for accurate pricing.'
  });
}
