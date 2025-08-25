export default {
  name: "getWeather",
  description: "Fetch current weather for a city",
  input_schema: {
    type: "object",
    properties: {
      location: { type: "string", description: "City name" }
    },
    required: ["location"]
  },
  run: async ({ location }) => {
    // fake data for now — replace with real API call if needed
    return { location, temp: "22°C", condition: "Sunny" };
  }
};
