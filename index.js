import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
  res.render('index', { uvData: null, error: null });
});

// Handle form submission
app.post('/', async (req, res) => {
  const city = req.body.city;
  const geoApiKey = 'b24e6bdbf34fc62b07bf74afb81e7dfe';

  try {
    // Get lat/lon using OpenWeatherMap Geocoding API
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${geoApiKey}`;
    const geoResponse = await axios.get(geoUrl);

    if (geoResponse.data.length === 0) {
      return res.render('index', { uvData: null, error: 'City not found.' });
    }

    const { lat, lon } = geoResponse.data[0];

    const uvUrl = `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lon}`;
    const uvResponse = await axios.get(uvUrl);

    if (!uvResponse.data.ok) {
      return res.render('index', { uvData: null, error: 'Unable to fetch UV index data.' });
    }

    const uvData = {
      city,
      lat,
      lon,
      value: uvResponse.data.now.uvi
    };

    res.render('index', { uvData, error: null });
  } catch (err) {
    console.error(err.message);
    res.render('index', { uvData: null, error: 'Something went wrong. Please try again.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

