/* server.js...typically separate these calls into controller & services */
const express = require('express')
const cors = require('cors');
const request = require('request');
const app = express();
const port = 3000;
// Considered mongoose but chose express/nodejs to learn more pure nodejs first
const mongo = require('mongodb').MongoClient;
// Default localhost port for mongoDB
const mongourl = 'mongodb://localhost:27017';
const ObjectId = require('mongodb').ObjectID;
const config = require('./config');
const googleApiKey = config.config.googleApi;
const encryptionPass = config.config.encryptionPass;

// Use cors to avoid Access Allow Origin errors since using different port for server vs application
app.use(cors());
app.options('*', cors());
app.use(express.json());

// Check if username already exists
app.get('/isUsernameTaken/:username', 
  function(req, res, next) {
    // Connect to database
    mongo.connect(mongourl, (err, client) => {
      // Check for error first
      if(err) {
        console.error(err);
        return;
      }
      // Connect to database and collection
      const db = client.db('ibmtest');
      const userCollection = db.collection('users');
      // findOne more efficient than find
      userCollection.findOne(
        { "username": req.params.username },
        (queryErr, result) => {
          if(queryErr) {
            console.error(queryErr, 'Error checking username availability.');
            // Return to initial call if error
            next(queryErr);
          } else {
            if (!!result) {
              // True username is taken
              res.send(true);
            } else {
              // False username is not taken
              res.send(false);
            }
          }
        }
      )
      client.close();
    });
  }
);

// Encryption so we aren't storing raw passwords
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = encryptionPass;

function encrypt(pw){
  var cipher = crypto.createCipher(algorithm,password)
  var encryptedPw = cipher.update(pw,'utf8','hex')
  encryptedPw += cipher.final('hex');
  return encryptedPw;
}
 
// Create new user in db
app.post('/newUser',
  function(request, response, next) {
    mongo.connect(mongourl, (err, client) => {
      // Check for error first
      if(err) {
        console.error(err);
        return;
      }
      const db = client.db('ibmtest');
      const userCollection = db.collection('users');
      // Inserting one user into db
      userCollection.insertOne(
        {
          "username":request.body.body.user, 
          // Encrypting password with crypto
          "password":encrypt(request.body.body.pass),
        },(insertErr, result) => {
          if(insertErr) {
            console.error(insertErr);
            next(insertErr);
          } else {
            response.send(result);
          }
        }
      )
      client.close();
    });
  }
);

// Login user...POST call instead of GET so password isn't in the url
app.post('/login',
  function(request, response, next) {
    mongo.connect(mongourl, (err, client) => {
      // Check for error first
      if(err) {
        console.error(err);
        return;
      }
      const db = client.db('ibmtest');
      const userCollection = db.collection('users');
      userCollection.findOne(
        { 
          // Need both username AND encrypted password to match database
          $and: [
            { 
              "username": request.body.body.user 
            }, 
            { 
              "password": encrypt(request.body.body.pass) 
            },
          ]
        },
        (loginErr, result) => {
          if(loginErr) {
            next(loginErr);
          } else {
            if (!!result) {
              response.send(result);
            } else {
              // If query didn't error, but user was not found...
              response.send({ 'loginFailed':'Login failed.' })
            }
          }
        }
      )
      client.close();
    });
  }
);

// Options for Google Geolocation API POST call
const options = {
  method: 'POST',
  uri: `https://www.googleapis.com/geolocation/v1/geolocate?key=${googleApiKey}`,
  body: {
    foo: 'bar'
  },
  json: true,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Find nearby restaurants
app.post('/findrestaurants/:keyword', 
  function(initialReq, initialRes, next) {
    // Post call to Google Geolocation API to get user location
    request.post(options, (geoErr, geoRes, geoBody) => {
      // Check for error first
      if(geoErr) {
        // Send error back from initial post if fails
        next(geoErr);
      } else {
        // Otherwise make a request to Google place API text search with latitude/longitude
        request(`https://maps.googleapis.com/maps/api/place/textsearch/json?location=${geoRes.body.location.lat},${geoRes.body.location.lng}&type=restaurant&query=${initialReq.params.keyword}&radius=800&key=${googleApiKey}`, 
          {},
          function (placeErr, placeRes, placeBody) {
            if (placeErr && placeRes.statusCode !== 200) {
              next(placeErr);
            } else {
              // Send place API's response to the initial call's response
              initialRes.send(placeBody);
            }
          }
        );
      }
    }
  )}
);

// Get restaurant details
app.get('/getdetails/:restaurantid', 
  function(initialReq, initialRes, next) {
    // Get details from Google Places Details API
    request(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${initialReq.params.restaurantid}&fields=review,formatted_phone_number,permanently_closed&key=${googleApiKey}`, 
      {},
      function (detailsErr, detailsRes, detailsBody) {
        // Check for error first
        if (detailsErr && detailsRes.statusCode !== 200) {
          next(detailsErr);
        } else {
          // Send to Sentiment for analysis, add that to body, then return to initial response
          initialRes.send(addReviewAnalysis(detailsBody));
        }
      }
    );
  }
);

/* Using Sentiment package since Turi is Python only right now. Possible downside is Sentiment
is not restaurant-focused, so something like 'fire' is negative even though might be slang */
var Sentiment = require('sentiment');
var sentiment = new Sentiment();

function addReviewAnalysis(detailsResp) {
  // Converting to JSON since detailsResp comes as a string
  const bodyJson = JSON.parse(detailsResp);
  // Check if restaurant has reviews
  if (!!bodyJson.result.reviews && !!bodyJson.result.reviews.length) {
    let reviews = '';
    // Compiling all of the reviews in one string so only have to call sentiment.analyze() once
    bodyJson.result.reviews.forEach(function(review) {
      // Adding space in case words are smashed together
      reviews += review.text + ' ';
    });
    var analysis = sentiment.analyze(reviews);
    // Adding analytics score to the body to be returned
    bodyJson.result.analytics_score = analysis.comparative;
  }
  return bodyJson;
}

// Getting user history for thumb rating
app.get('/getUserHistory/:userId', 
  function(req, res, next) {
    // Connect to mongo
    mongo.connect(mongourl, (err, client) => {
      // Check for error first
      if(err) {
        console.error(err);
        return;
      }
      // Name database & collection
      const db = client.db('ibmtest');
      const userCollection = db.collection('users');
      // findOne more efficient than find
      userCollection.findOne(
        { "_id": ObjectId(req.params.userId) },
        (queryErr, result) => {
          if(queryErr) {
            console.error(queryErr, 'Error getting user history');
            next(queryErr);
          } else {
            if (!!result.history) {
              // Sending only history so we don't send hashed password & other user data
              res.send(result.history);
            } else {
              // If the call doesn't error, but user doesn't have history or doesn't exist
              res.send({'noUserHistory': 'User has no history.'});
            }
          }
        }
      );
      client.close();
    });
  }
);

// Insert user thumb rating for restaurant if none exists in db, otherwise update
app.post('/upsertThumb',
  function(request, response, next) {
    mongo.connect(mongourl, (err, client) => {
      if(err) {
        console.error(err);
        return;
      }
      const db = client.db('ibmtest');
      const userCollection = db.collection('users');
      // Assigning here so typescript doesn't throw an error later
      const historyPlaceId = `history.${request.body.body.placeId}`;
      /* Using findOneAndUpdate instead of update so will return new doc,
         instead of findAndModify so calls are more specific,
         instead of findAndReplace so updates, instead of replacing */
      userCollection.findOneAndUpdate(
        // Filter by id
        { "_id": ObjectId(`${request.body.body.userId}`) },
        /* Using $set, instead of $setOnInsert because that only runs when inserting,
           instead of $push and $addToSet because that adds in history but does not update */
        // Update the following data...
        { $set:
          // Storing the placeId as key and value as true/false, so easier to query in this small application
          // Because each key is unique...can use history object instead of adding another layer with array
          { 
            [historyPlaceId]: request.body.body.rating 
          },
        },
        // Upsert if history doesn't exist yet in db
        {
          upsert: true,
        },
        (updateErr,result) => {
          if(updateErr) {
            next(updateErr);
          } else {
            if (!!result) {
              // Daisy chain call to update restaurant rating in restaurant collection
              findRestaurantRating(request.body.body.placeId, request.body.body.rating, true, false, false);
              // Sending simple message
              response.send({ 'ratingSuccess': 'Rating successful!' });
            } else {
              response.send({ 'ratingFailed': 'Failed to submit rating to user profile.' });
            }
          }
        });
      client.close();
    }
  )
});

// Find restaurant rating to restaurant collection...updating is separate function
function findRestaurantRating(placeId, newRating, update, res, next) {
  mongo.connect(mongourl, (err,client) => {
    // Check for error first
    if(err) {
      console.error(err);
      return;
    }
    const db = client.db('ibmtest');
    // Connecting to restaurant collection
    const userCollection = db.collection('restaurants')
    userCollection.findOne(
      // Query based on placeId since database "_id" are different between collections
      { [placeId]: { $exists: true } },
      (err,result) => { 
        if(err) {
          console.error(err);
          // If we're updating rating...chained from user rating call...
          if (!!update) {
            return err;
          } else {
            // Otherwise if just retrieving the rating then return to call
            next(err);
          }
        } else {
          if (!!result) {
            // If we're updating rating...chained from user rating call...
            if(!!update) {
              updateRestaurantRating(placeId, newRating, result[placeId])
            } else {
              // Otherwise if just retrieving the rating then return to call
              res.send(result);
            }
          } else {
            // If could not find restaurant in collection...
            if(!!update) {
              // If updating, then score is 0 so far
              updateRestaurantRating(placeId, newRating, 0)
            } else {
              // Otherwise return that restaurant does not exist yet.
              res.send({ 'noRatings':'Restaurant has not been rated yet.' });
            }        
          }
        }
      });
      client.close();
  });
};

// Call if just retrieving rating from details
app.get('/getRestaurantRating/:placeId', 
  function(req, res, next) {
    findRestaurantRating(req.params.placeId, false, false, res, next);
  }
);

// Chained call so that can increment/decrement the rating number and so can stay D.R.Y.
// since using find function in separate details call.
function updateRestaurantRating(placeId, newRating, score) {
  // If the rating is positive then +1, otherwise -1
  const initialThumbValue = !!newRating ? 1 : -1;
  mongo.connect(mongourl, (err,client) => {
    if(err) {
      console.error(err);
      return;
    }
    const db = client.db('ibmtest')
    // Connect to restaurant collection
    const userCollection = db.collection('restaurants')
    userCollection.findOneAndUpdate(
      // Query based on placeid since _id are different between collections
      { [placeId]: { $exists: true } },
      // Update score
      { $set:
        {
          [placeId]: initialThumbValue + score
        },
      },
      // Options for findOneAndUpdate
      {
        upsert: true,
      },
      (updateErr,result) => {
        if(updateErr) {
          console.error(updateErr);
          return updateErr;
        } else {
          if (!!result) {
            return result;
          } else {
            console.error('Restaurant score could not be updated');
            return { 'failedUpdate': 'Restaurant score could not be updated.' };
          }
        }
      })
    client.close();
  });
};

// Server listening for calls to it
app.listen(port, (err) => {
  if (err) {
    return console.error(err, 'Error occurred on server listen');
  }
  console.log(`Server is listening on ${port}`);
});
