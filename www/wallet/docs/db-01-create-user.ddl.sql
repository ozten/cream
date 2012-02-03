DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER NOT NULL AUTO_INCREMENT,
  email VARCHAR(256) NOT NULL UNIQUE,
  PRIMARY KEY(id),
  created TIMESTAMP default CURRENT_TIMESTAMP,
  INDEX(email, id)
);

DROP TABLE IF EXISTS purchased_volumes;
CREATE TABLE purchased_volumes (
  user_id INTEGER NOT NULL,
  volume_id INTEGER NOT NULL,
  created TIMESTAMP default CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, volume_id)
);

DROP TABLE IF EXISTS stripe_customers;
CREATE TABLE stripe_customers (
  user_id INTEGER NOT NULL,
  customer_id VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, customer_id)
);