// Complete world location data using country-state-city package
import { Country, State, City } from 'country-state-city';

/**
 * Get all countries in the world (250+ countries)
 * Returns array of objects with { name, isoCode, phonecode, flag, etc. }
 */
export const getCountries = () => {
  const countries = Country.getAllCountries();

  // Sort alphabetically by name
  return countries
    .map(country => ({
      name: country.name,
      isoCode: country.isoCode,
      phonecode: country.phonecode,
      flag: country.flag,
      currency: country.currency,
      latitude: country.latitude,
      longitude: country.longitude
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get all states/provinces for a specific country
 * @param {string} countryIsoCode - ISO code of country (e.g., 'IN', 'US', 'GB')
 * Returns array of state objects
 */
export const getStates = (countryIsoCode) => {
  if (!countryIsoCode) return [];

  const states = State.getStatesOfCountry(countryIsoCode);

  // If no states found, return empty array (some small countries don't have states)
  if (!states || states.length === 0) return [];

  // Sort alphabetically by name
  return states
    .map(state => ({
      name: state.name,
      isoCode: state.isoCode,
      countryCode: state.countryCode,
      latitude: state.latitude,
      longitude: state.longitude
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get all cities for a specific state in a country
 * @param {string} countryIsoCode - ISO code of country (e.g., 'IN', 'US')
 * @param {string} stateIsoCode - ISO code of state (e.g., 'BR' for Bihar, 'CA' for California)
 * Returns array of city objects
 */
export const getCities = (countryIsoCode, stateIsoCode) => {
  if (!countryIsoCode) return [];

  // If no state provided or state not available, get all cities of country
  if (!stateIsoCode) {
    const cities = City.getCitiesOfCountry(countryIsoCode);
    if (!cities || cities.length === 0) return [];

    return cities
      .map(city => ({
        name: city.name,
        stateCode: city.stateCode,
        countryCode: city.countryCode,
        latitude: city.latitude,
        longitude: city.longitude
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get cities of specific state
  const cities = City.getCitiesOfState(countryIsoCode, stateIsoCode);

  if (!cities || cities.length === 0) return [];

  // Sort alphabetically by name
  return cities
    .map(city => ({
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
      latitude: city.latitude,
      longitude: city.longitude
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Get country by name (for backward compatibility)
 * @param {string} countryName - Name of country
 * Returns country object with isoCode
 */
export const getCountryByName = (countryName) => {
  if (!countryName) return null;

  const countries = Country.getAllCountries();
  return countries.find(country =>
    country.name.toLowerCase() === countryName.toLowerCase()
  );
};

/**
 * Get state by name within a country
 * @param {string} countryIsoCode - ISO code of country
 * @param {string} stateName - Name of state
 * Returns state object with isoCode
 */
export const getStateByName = (countryIsoCode, stateName) => {
  if (!countryIsoCode || !stateName) return null;

  const states = State.getStatesOfCountry(countryIsoCode);
  return states.find(state =>
    state.name.toLowerCase() === stateName.toLowerCase()
  );
};

// Export for direct usage if needed
export { Country, State, City };
