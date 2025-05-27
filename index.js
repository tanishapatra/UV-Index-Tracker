import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine and specify the views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));
// Middleware to serve static files (like CSS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- UV Precaution Data ---
// This object defines the summary and detailed precautions for different UV Index levels.
const uvPrecautionLevels = {
    0: {
        summary: "No sun protection needed. Safest level.",
        details: "<ul><li>No sun protection is needed.</li><li>Enjoy the outdoors!</li></ul>"
    },
    1: {
        summary: "No sun protection needed. Safest level.",
        details: "<ul><li>No sun protection is needed.</li><li>Enjoy the outdoors!</li></ul>"
    },
    2: {
        summary: "Low risk. Minimal protection needed.",
        details: "<ul><li>Wear sunglasses on bright days.</li><li>If you burn easily, cover up and use sunscreen.</li></ul>"
    },
    3: {
        summary: "Moderate risk. Take precautions.",
        details: "<ul><li>Wear a hat, sunglasses, and protective clothing.</li><li>Apply sunscreen SPF 30+ every 2 hours, even on cloudy days.</li><li>Seek shade between 10 AM and 4 PM.</li></ul>"
    },
    4: {
        summary: "Moderate risk. Take precautions.",
        details: "<ul><li>Wear a hat, sunglasses, and protective clothing.</li><li>Apply sunscreen SPF 30+ every 2 hours, even on cloudy days.</li><li>Seek shade between 10 AM and 4 PM.</li></ul>"
    },
    5: {
        summary: "Moderate risk. Take precautions.",
        details: "<ul><li>Wear a hat, sunglasses, and protective clothing.</li><li>Apply sunscreen SPF 30+ every 2 hours, even on cloudy days.</li><li>Seek shade between 10 AM and 4 PM.</li></ul>"
    },
    6: {
        summary: "High risk. Protect yourself from sun exposure.",
        details: "<ul><li>Reduce time in the sun between 10 AM and 4 PM.</li><li>Cover up with protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Liberally apply sunscreen SPF 30+ or higher.</li></ul>"
    },
    7: {
        summary: "High risk. Protect yourself from sun exposure.",
        details: "<ul><li>Reduce time in the sun between 10 AM and 4 PM.</li><li>Cover up with protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Liberally apply sunscreen SPF 30+ or higher.</li></ul>"
    },
    8: {
        summary: "Very High risk. Extra protection essential.",
        details: "<ul><li>Avoid sun exposure between 10 AM and 4 PM.</li><li>Generously apply sunscreen SPF 30+ or higher.</li><li>Wear protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Seek shade whenever possible.</li></ul>"
    },
    9: {
        summary: "Very High risk. Extra protection essential.",
        details: "<ul><li>Avoid sun exposure between 10 AM and 4 PM.</li><li>Generously apply sunscreen SPF 30+ or higher.</li><li>Wear protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Seek shade whenever possible.</li></ul>"
    },
    10: {
        summary: "Very High risk. Extra protection essential.",
        details: "<ul><li>Avoid sun exposure between 10 AM and 4 PM.</li><li>Generously apply sunscreen SPF 30+ or higher.</li><li>Wear protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Seek shade whenever possible.</li></ul>"
    },
    11: {
        summary: "Extreme risk. Take all precautions.",
        details: "<ul><li>Stay indoors if possible, especially between 10 AM and 4 PM.</li><li>If outdoors, wear full protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Apply sunscreen SPF 50+ generously and reapply often.</li><li>Seek shade and avoid reflective surfaces.</li></ul>"
    },
    12: { // Added for completeness, though 11 is often the highest officially listed "extreme"
        summary: "Extreme risk. Take all precautions.",
        details: "<ul><li>Stay indoors if possible, especially between 10 AM and 4 PM.</li><li>If outdoors, wear full protective clothing, a wide-brimmed hat, and UV-blocking sunglasses.</li><li>Apply sunscreen SPF 50+ generously and reapply often.</li><li>Seek shade and avoid reflective surfaces.</li></ul>"
    }
};

// --- Routes ---

// GET route for the homepage (displays the form)
app.get('/', (req, res) => {
    res.render('index', { uvData: null, error: null, uvPrecautionSummary: null, uvDetailedPrecautions: null });
});

// POST route for handling city submission and fetching UV data
app.post('/', async (req, res) => {
    const city = req.body.city;
    const geoApiKey = 'b24e6bdbf34fc62b07bf74afb81e7dfe'; // Your OpenWeatherMap API Key

    try {
        // Step 1: Get Latitude and Longitude from OpenWeatherMap Geocoding API
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${geoApiKey}`;
        const geoResponse = await axios.get(geoUrl);

        if (geoResponse.data.length === 0) {
            // If no city is found by OpenWeatherMap
            return res.render('index', { uvData: null, error: 'City not found. Please check the spelling.', uvPrecautionSummary: null, uvDetailedPrecautions: null });
        }

        const { lat, lon } = geoResponse.data[0];

        // Step 2: Get UV Index from currentuvindex.com API
        const uvUrl = `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lon}`;
        const uvResponse = await axios.get(uvUrl);

        // Check if the UV API response indicates an error or no data
        if (!uvResponse.data || !uvResponse.data.ok || typeof uvResponse.data.now.uvi === 'undefined') {
            return res.render('index', { uvData: null, error: 'Unable to fetch UV index data for this location.', uvPrecautionSummary: null, uvDetailedPrecautions: null });
        }

        // Round UV index to the nearest whole number for precaution lookup
        const uvIndexValue = Math.round(uvResponse.data.now.uvi);

        // Prepare the data to be sent to the EJS template
        const uvData = {
            city: city, // Use the original city name for display
            lat: lat.toFixed(4), // Round lat/lon for cleaner display
            lon: lon.toFixed(4),
            value: uvIndexValue
        };

        // Step 3: Determine precautions based on the UV index value
        const precaution = uvPrecautionLevels[uvIndexValue] || {
            summary: "UV index is out of standard range or undefined. Exercise extreme caution.",
            details: "<ul><li>Please consult local health advisories for this unusual UV index.</li></ul>"
        };

        // Render the index page with all the fetched data and precaution details
        res.render('index', {
            uvData,
            error: null,
            uvPrecautionSummary: precaution.summary,
            uvDetailedPrecautions: precaution.details
        });

    } catch (err) {
        // Log the full error for debugging purposes
        console.error("Error fetching UV data:", err.message);
        if (err.response) {
            console.error("API Response Data:", err.response.data);
            console.error("API Response Status:", err.response.status);
        }
        // Render the index page with a generic error message
        res.render('index', {
            uvData: null,
            error: 'Something went wrong. Please try again or try a different city.',
            uvPrecautionSummary: null,
            uvDetailedPrecautions: null
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
