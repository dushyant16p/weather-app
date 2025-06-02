
        const apiKey = config.apiKey; // <-- Replace with your OpenWeather API key

        const weatherForm = document.getElementById('weatherForm');
        const cityInput = document.getElementById('cityInput');
        const weatherResult = document.getElementById('weatherResult');

        function kelvinToCelsius(k) {
            return (k - 273.15).toFixed(1);
        }
        function kelvinToFahrenheit(k) {
            return ((k - 273.15) * 9/5 + 32).toFixed(1);
        }
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
        function unixToTime(ts, tzOffset) {
            // ts: unix timestamp (seconds), tzOffset: seconds
            const date = new Date((ts + tzOffset) * 1000);
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        function getWindDirection(deg) {
            const dirs = ['N','NE','E','SE','S','SW','W','NW'];
            return dirs[Math.round(deg/45)%8];
        }
        function getAQILevel(aqi) {
            // 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor
            const levels = [
                {label: "Good", color: "#4caf50"},
                {label: "Fair", color: "#8bc34a"},
                {label: "Moderate", color: "#ffeb3b"},
                {label: "Poor", color: "#ff9800"},
                {label: "Very Poor", color: "#f44336"}
            ];
            return levels[aqi-1] || {label: "Unknown", color: "#bdbdbd"};
        }

        async function fetchWeather(city) {
            weatherResult.innerHTML = `<div class="loader"></div>`;
            try {
                // Weather data
                const res = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`
                );
                if (!res.ok) throw new Error('City not found');
                const data = await res.json();

                // Air Quality data
                const {lat, lon} = data.coord;
                let air = null;
                try {
                    const airRes = await fetch(
                        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
                    );
                    if (airRes.ok) air = await airRes.json();
                } catch {}

                // Forecast data (for min/max temp)
                let forecast = null;
                try {
                    const forecastRes = await fetch(
                        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`
                    );
                    if (forecastRes.ok) forecast = await forecastRes.json();
                } catch {}

                showWeather(data, air, forecast);
            } catch (err) {
                weatherResult.innerHTML = `<div class="error">❌ ${err.message}</div>`;
            }
        }

        function showWeather(data, air, forecast) {
            const icon = data.weather[0].icon;
            const desc = capitalize(data.weather[0].description);
            const tempC = kelvinToCelsius(data.main.temp);
            const tempF = kelvinToFahrenheit(data.main.temp);
            const feelsC = kelvinToCelsius(data.main.feels_like);
            const feelsF = kelvinToFahrenheit(data.main.feels_like);
            const humidity = data.main.humidity;
            const wind = data.wind.speed;
            const windDeg = data.wind.deg;
            const pressure = data.main.pressure;
            const city = data.name;
            const country = data.sys.country;
            const visibility = data.visibility ? (data.visibility/1000).toFixed(1) : 'N/A';
            const clouds = data.clouds ? data.clouds.all : 'N/A';
            const sunrise = unixToTime(data.sys.sunrise, data.timezone - (new Date().getTimezoneOffset()*60));
            const sunset = unixToTime(data.sys.sunset, data.timezone - (new Date().getTimezoneOffset()*60));
            const minTemp = forecast ? kelvinToCelsius(Math.min(...forecast.list.slice(0,8).map(f=>f.main.temp_min))) : kelvinToCelsius(data.main.temp_min || data.main.temp);
            const maxTemp = forecast ? kelvinToCelsius(Math.max(...forecast.list.slice(0,8).map(f=>f.main.temp_max))) : kelvinToCelsius(data.main.temp_max || data.main.temp);

            // Air Quality
            let aqi = null, pm2_5 = null, pm10 = null, co = null, no2 = null, o3 = null;
            if (air && air.list && air.list.length) {
                aqi = air.list[0].main.aqi;
                pm2_5 = air.list[0].components.pm2_5;
                pm10 = air.list[0].components.pm10;
                co = air.list[0].components.co;
                no2 = air.list[0].components.no2;
                o3 = air.list[0].components.o3;
            }

            weatherResult.innerHTML = `
                <div class="weather-card">
                    <div class="weather-main">
                        <img src="https://openweathermap.org/img/wn/${icon}@4x.png" alt="${desc}">
                        <div class="main-info">
                            <div class="temp">${tempC}°C <span>/ ${tempF}°F</span></div>
                            <div class="desc">${desc}</div>
                            <div class="location">
                                <span style="font-size:1.2em;vertical-align:middle;">📍</span> ${city}, ${country}
                            </div>
                        </div>
                    </div>
                    <div class="details">
                        <div class="detail">
                            <div class="detail-icon">🌡️</div>
                            <div class="detail-label">Feels Like</div>
                            <span>${feelsC}°C / ${feelsF}°F</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">💧</div>
                            <div class="detail-label">Humidity</div>
                            <span>${humidity}%</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">🌬️</div>
                            <div class="detail-label">Wind</div>
                            <span>${wind} m/s<br><small style="color:#b2eaff;">${getWindDirection(windDeg)}</small></span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">🔽</div>
                            <div class="detail-label">Min Temp</div>
                            <span>${minTemp}°C</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">🔼</div>
                            <div class="detail-label">Max Temp</div>
                            <span>${maxTemp}°C</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">☁️</div>
                            <div class="detail-label">Clouds</div>
                            <span>${clouds}%</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">👁️</div>
                            <div class="detail-label">Visibility</div>
                            <span>${visibility} km</span>
                        </div>
                        <div class="detail">
                            <div class="detail-icon">🧭</div>
                            <div class="detail-label">Pressure</div>
                            <span>${pressure} hPa</span>
                        </div>
                    </div>
                    <div class="sun-times">
                        <div class="sun-time">
                            <span class="detail-icon">🌅</span>
                            <span>Sunrise: ${sunrise}</span>
                        </div>
                        <div class="sun-time">
                            <span class="detail-icon">🌇</span>
                            <span>Sunset: ${sunset}</span>
                        </div>
                    </div>
                    <div class="extra-details">
                        ${aqi ? `
                        <div class="extra-detail">
                            <span class="detail-icon">🫁</span>
                            <span>Air Quality: <span style="color:${getAQILevel(aqi).color};font-weight:700;">${getAQILevel(aqi).label}</span></span>
                        </div>
                        <div class="extra-detail">
                            <span class="detail-icon">🌫️</span>
                            <span>PM2.5: <b>${pm2_5}</b> μg/m³</span>
                        </div>
                        <div class="extra-detail">
                            <span class="detail-icon">🌫️</span>
                            <span>PM10: <b>${pm10}</b> μg/m³</span>
                        </div>
                        <div class="extra-detail">
                            <span class="detail-icon">🧪</span>
                            <span>CO: <b>${co}</b> μg/m³</span>
                        </div>
                        <div class="extra-detail">
                            <span class="detail-icon">🧪</span>
                            <span>NO₂: <b>${no2}</b> μg/m³</span>
                        </div>
                        <div class="extra-detail">
                            <span class="detail-icon">🧪</span>
                            <span>O₃: <b>${o3}</b> μg/m³</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        weatherForm.addEventListener('submit', e => {
            e.preventDefault();
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        });

        // Optionally, show weather for a default city on load
        // fetchWeather('London');
  