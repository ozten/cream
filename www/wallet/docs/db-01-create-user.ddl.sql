DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(256) CHARACTER SET latin1 NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `email_2` (`email`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

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

DROP TABLE IF EXISTS punkmoney_oauth;
CREATE TABLE `punkmoney_oauth` (
  `email` varchar(255) NOT NULL,
  `twitter_access_token` varchar(255) NOT NULL DEFAULT '',
  `twitter_access_token_secret` varchar(255) NOT NULL DEFAULT '',
  UNIQUE KEY `twitter_access_token` (`twitter_access_token`,`twitter_access_token_secret`),
  KEY `email` (`email`,`twitter_access_token`,`twitter_access_token_secret`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;