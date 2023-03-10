// DATABASE CONFIG

const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool.query(`SELECT * FROM users WHERE email = $1`, [email])
  .then((result) => {
    return(result.rows[0])
  })
  .catch((err) => {
    console.log(err.message);
  });
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {

  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((result) => {
    return(result.rows[0])
  })
  .catch((err) => {
    console.log(err.message);
  });
}

exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`, [user.name, user.email, user.password] )
  .then((result) => {
    return(result.rows[0])
  })
  .catch((err) => {
    console.log(err.message);
  });
}

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  
  return pool.query(
    `SELECT reservations.*, properties.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    WHERE reservations.guest_id = $1
    LIMIT $2`, [guest_id, limit])
  .then((result) => {
    return(result.rows)
  })
  .catch((err) => {
    console.log(err.message);
  });

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = (options, limit = 10) => {

  //1
  const queryParams = []

  //2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.owner_id) {
    queryParams.push(options.owner_id)
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night)
    queryParams.length >= 2 ? queryString += 'AND ' : queryString += 'WHERE ';
    queryString += `cost_per_night > $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night)
    queryParams.length >= 2 ? queryString += 'AND ' : queryString += 'WHERE ';
    queryString += `cost_per_night < $${queryParams.length} `;
  }
  
  queryString += `GROUP BY properties.id `

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating)
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit)
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const p = property;

  return pool.query (`INSERT INTO properties
   (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, active)
   VALUES
   ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`, [p.owner_id, p.title, p.description, p.thumbnail_photo_url, p.cover_photo_url, p.cost_per_night, p.parking_spaces, p.number_of_bathrooms, p.number_of_bedrooms, p.country, p.street, p.city, p.province, p.post_code, true])
   .then((result) => {
    return(result.rows)
  })
  .catch((err) => {
    console.log(err.message);
  });
}

exports.addProperty = addProperty;
