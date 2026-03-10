const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY || 'patiZfJeZ4xrCs0CO.dbdd05f8c5017039d389cd9ac370a0ebe64f5c552a1eb1b125e87bf15121ffa5';
const baseId = process.env.AIRTABLE_BASE_ID || 'appOq32vzdfx8XXmF';

const base = new Airtable({apiKey}).base(baseId);

async function checkPending() {
  console.log("Checking AppointmentRequests table...");
  try {
    const records = await base('AppointmentRequests').select({
      filterByFormula: "{Status} = 'Pending'",
      maxRecords: 5
    }).all();
    
    console.log(`Found ${records.length} pending records.`);
    records.forEach(r => {
      console.log(`- ID: ${r.id}, Symptoms: ${r.fields.Symptoms}, Status: ${r.fields.Status}`);
    });

    if (records.length === 0) {
      console.log("No pending records found. Trying without filter...");
      const all = await base('AppointmentRequests').select({ maxRecords: 3 }).all();
      all.forEach(r => {
        console.log(`- ID: ${r.id}, Status: '${r.fields.Status}' (Type: ${typeof r.fields.Status})`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

checkPending();
