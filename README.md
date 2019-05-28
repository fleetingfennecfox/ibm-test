# Instructions to run this project

1) Please make sure you have `node` and `npm` installed for this project.

2) Navigate to this project in the terminal and run `npm install` to install dependencies. 

3a) You'll need to set up a mongoDB database running on the default port `mongodb://localhost:27017`.
3b) In this database, please set up a database called `ibmtest`. If you're using mongo shell in the terminal, you can do this using the command `use ibmtest`. 
3c) Lastly, please set up two collections called `users` and `restaurants`. If you're using mongo shell in the terminal, you can do this using `db.createCollection("users")` and `db.createCollection("restaurants")` respectively. 

4a) Create a file called `config.js` in the root of the project.
4b) Add the following code in the `config.js` file with whatever password you'd like for `encryptionPass` and your respective Google API key, enabled for the `Places API` and the `Geolocation API`.

```
module.exports.config = {
    'encryptionPass': 'YOUR_PASSWORD_HERE',
    'googleApi': 'YOUR_KEY_HERE',
};
```

5) Open a terminal, navigate to the project, and run `node server.js` to start the server on `http://localhost:3000/`.

6) Open a second terminal, navigate to the project, and run `ng serve` to serve application on `http://localhost:4200/`.