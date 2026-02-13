import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shopId } = req.query;

  try {
    // Get base jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('connect_specs_jobs')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (jobsError) throw jobsError;

    // If shopId provided, merge with overrides
    if (shopId) {
      const { data: overrides } = await supabase
        .from('shop_overrides')
        .select('*')
        .eq('shop_id', shopId);

      const mergedJobs = jobs
        .filter(job => !overrides?.find(o => o.job_id === job.id && o.is_hidden))
        .map(job => {
          const override = overrides?.find(o => o.job_id === job.id);
          if (override) {
            return {
              ...job,
              base_hours: override.base_hours_override ?? job.base_hours,
              rate_type: override.rate_type_override ?? job.rate_type
            };
          }
          return job;
        });

      return res.json({ jobs: mergedJobs });
    }

    return res.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
