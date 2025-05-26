import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (like CSS)
app.use(express.static(path.join(__dirname, 'public')));

// GET route for form
app.get('/', (req, res) => {
  res.render('index', { uvData: null, error: null });
});

// POST route to handle form submission
app.post('/', async (req, res) => {
  const city = req.body.city;
  const apiKey = 'b24e6bdbf34fc62b07bf74afb81e7dfe'; // Your OpenWeatherMap API key

  try {
    // Encode city name to handle spaces/special characters
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
    const geoResponse = await axios.get(geoURL);
    console.log('Geo Response:', geoResponse.data);

    if (geoResponse.data.length === 0) {
      return res.render('index', { uvData: null, error: 'City not found.' });
    }

    const { lat, lon } = geoResponse.data[0];
    console.log(`Coordinates for ${city}: lat=${lat}, lon=${lon}`);

    // Use One Call API to get UV index (among other weather data)
    const oneCallURL = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}`;
    const oneCallResponse = await axios.get(oneCallURL);
    console.log('One Call Response:', oneCallResponse.data);

    if (!oneCallResponse.data.current || typeof oneCallResponse.data.current.uvi === 'undefined') {
      return res.render('index', { uvData: null, error: 'UV data not available for this location.' });
    }

    const uvData = {
      city,
      lat,
      lon,
      value: oneCallResponse.data.current.uvi
    };

    res.render('index', { uvData, error: null });

  } catch (error) {
    console.error('Error fetching data:', error.response ? error.response.data : error.message);
    res.render('index', { uvData: null, error: 'Something went wrong. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
