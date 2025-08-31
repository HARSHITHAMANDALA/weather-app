import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const API_KEY = "7c7a643ef9da333c3c816e57a80e6f76"; // Replace with your OpenWeather API key

export default function App() {
  const [city, setCity] = useState("London");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [aqi, setAqi] = useState(null);

  const getAqiLabelAndColor = (aqi) => {
    switch (aqi) {
      case 1: return { label: "Good", color: "#2ecc71" };
      case 2: return { label: "Fair", color: "#f1c40f" };
      case 3: return { label: "Moderate", color: "#e67e22" };
      case 4: return { label: "Poor", color: "#e74c3c" };
      case 5: return { label: "Very Poor", color: "#8e44ad" };
      default: return { label: "--", color: "#333" };
    }
  };

  const getWeatherBackground = () => {
    if (!weather) return "bg-default";
    const main = weather.weather?.[0]?.main?.toLowerCase();
    if (main === "clear") return "bg-clear";
    if (main === "clouds") return "bg-clouds";
    if (main === "rain" || main === "drizzle" || main === "thunderstorm") return "bg-rain";
    if (main === "snow") return "bg-snow";
    if (main === "mist" || main === "fog" || main === "haze") return "bg-mist";
    return "bg-default";
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      setWeather(data);

      // AQI
      const aqiRes = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${data.coord.lat}&lon=${data.coord.lon}&appid=${API_KEY}`
      );
      const aqiData = await aqiRes.json();
      setAqi(aqiData.list[0].main.aqi);

      // Forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      const forecastData = await forecastRes.json();
      if (forecastData.list) {
        // Pick one point per day (around 12:00 PM)
        const dailyData = forecastData.list.filter(item =>
          item.dt_txt.includes("12:00:00")
        ).map(item => ({
          date: item.dt_txt.split(" ")[0],
          temp: item.main.temp
        }));
        setForecast(dailyData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );
            const data = await res.json();
            setWeather(data);
            setCity(data.name);

            const aqiRes = await fetch(
              `http://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
            );
            const aqiData = await aqiRes.json();
            setAqi(aqiData.list[0].main.aqi);

            const forecastRes = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
            );
            const forecastData = await forecastRes.json();
            if (forecastData.list) {
              const dailyData = forecastData.list.filter(item =>
                item.dt_txt.includes("12:00:00")
              ).map(item => ({
                date: item.dt_txt.split(" ")[0],
                temp: item.main.temp
              }));
              setForecast(dailyData);
            }
          } catch (err) {
            console.error(err);
          }
        },
        (error) => {
          alert("Unable to retrieve your location.");
          console.error(error);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className={`app ${getWeatherBackground()}`}>
      <h1>🌤 Weather App</h1>
      <div className="search-container">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
          className="input"
        />
        <button onClick={fetchWeather} className="button">Search</button>
        <button onClick={fetchCurrentLocation} className="button current-location">📍 Current Location</button>
      </div>

      {weather && (
        <div className="weather-card">
          <h2 className="weather-city">{weather.name}</h2>
          <p className="weather-desc">{weather.weather?.[0]?.description ?? "No description"}</p>
          <h3 className="weather-temp">{weather.main?.temp ?? "--"}°C</h3>
          <div className="weather-extra">
            <p>🌬️ Wind: {weather.wind?.speed ?? "--"} m/s</p>
            <p>☀️ Sunrise: {new Date(weather.sys?.sunrise * 1000).toLocaleTimeString()}</p>
            <p>🌇 Sunset: {new Date(weather.sys?.sunset * 1000).toLocaleTimeString()}</p>
            {aqi && (
              <p>
                🟢 AQI: {aqi} ({getAqiLabelAndColor(aqi).label})
              </p>
            )}
          </div>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="forecast-card">
          <h2>📅 5-Day Temperature Forecast</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="temp" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}



