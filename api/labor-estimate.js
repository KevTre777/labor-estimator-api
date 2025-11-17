// Simple Labor Estimator API - MVP Version
// This returns mock data for now - will integrate VehicleDatabases API later

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

    // Mock labor data (replace with VehicleDatabases API call later)
    const mockLaborHours = {
      min: 1.2,
      max: 1.8,
      recommended: 1.5
    };

    const mockPartsCost = 180;

    // Calculate pricing
    const suggestedLaborPrice = mockLaborHours.recommended * shop_rate;
    const totalEstimate = suggestedLaborPrice + mockPartsCost;

    // Return response
    return res.status(200).json({
      status: 'success',
      job_code,
      job_name,
      year,
      make,
      model,
      labor_hours_min: mockLaborHours.min,
      labor_hours_max: mockLaborHours.max,
      labor_hours_recommended: mockLaborHours.recommended,
      shop_rate,
      suggested_labor_price: suggestedLaborPrice,
      parts_cost_estimate: mockPartsCost,
      total_estimate: totalEstimate
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}
