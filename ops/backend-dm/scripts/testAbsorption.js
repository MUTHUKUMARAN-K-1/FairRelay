const axios = require('axios');

/**
 * Test script for e-Way Bill Absorption
 * Run this after fixing the database connection: `node scripts/testAbsorption.js`
 */

const BASE_URL = 'http://localhost:3000/api/eway-bill';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a valid dispatcher token

async function testAbsorption() {
    try {
        console.log('--- Testing e-Way Bill Absorption Endpoint ---');

        const payload = {
            exporterPhone: "9876543210",
            importerPhone: "1234567890",
            exporterTruckPlate: "KA-01-AB-1234",
            importerTruckPlate: "KA-02-CD-5678",
            exchangedGoods: ["delivery-id-1", "delivery-id-2"] // Replace with actual IDs
        };

        const response = await axios.post(`${BASE_URL}/absorption`, payload, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer' // Expecting a zip file
        });

        console.log('✅ Success: Received zip file');
        console.log('Response Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);

        // In a real test, you would save this to a file
        // fs.writeFileSync('test_output.zip', response.data);

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.statusText : error.message);
        if (error.response && error.response.data) {
            try {
                const errorData = JSON.parse(Buffer.from(error.response.data).toString());
                console.error('Error Details:', errorData);
            } catch (e) {
                console.error('Error response could not be parsed as JSON');
            }
        }
    }
}

// Note: Ensure the server is running before executing this
// testAbsorption();

console.log('Script loaded. To test, ensure your local server is running and database is connected.');
