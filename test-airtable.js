const Airtable = require('airtable');

const apiKey = process.env.AIRTABLE_API_KEY || 'patiZfJeZ4xrCs0CO.dbdd05f8c5017039d389cd9ac370a0ebe64f5c552a1eb1b125e87bf15121ffa5';
const baseId = process.env.AIRTABLE_BASE_ID || 'appOq32vzdfx8XXmF';

const base = new Airtable({apiKey}).base(baseId);

async function test() {
  console.log("Testing Airtable Connection...");
  console.log("Base ID:", baseId);
  console.log("API Key:", apiKey.substring(0, 10) + "...");

  try {
    // Try to read from 'Patients' table
    const records = await base('Patients').select({maxRecords: 1}).firstPage();
    console.log("Success! Found", records.length, "records in 'Patients'.");
  } catch (error) {
    console.error("Error reading 'Patients':", error.message);
    if (error.statusCode === 403) {
      console.error("Reason: NOT_AUTHORIZED. Check if the token has 'data.records:read' scope and access to this Base.");
    }
    if (error.statusCode === 404) {
        console.error("Reason: NOT_FOUND. The table 'Patients' might not exist.");
    }
  }

  try {
      // Try to read from 'Leads' table (legacy check)
      const records = await base('Leads').select({maxRecords: 1}).firstPage();
      console.log("Success! Found", records.length, "records in 'Leads'.");
    } catch (error) {
      console.error("Error reading 'Leads':", error.message);
    }
}

test();
