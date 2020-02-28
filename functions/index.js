const functions = require('firebase-functions');

const axios = require('axios');
const cors = require('cors')({ origin: true });
const spoonacularKey = functions.config().spoonacular.key;

// The Firebase Admin SDK to access the Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();
let db = admin.firestore();

exports.addUserConfig = functions.https.onRequest( (req, res) => {

  cors(req, res, () => {});
  const user = req.body.userName;
  const cuisines = req.body.cuisines;

  // Push the new message into Cloud Firestore using the Firebase Admin SDK.
  db.collection('user_config').doc(user).set({'cuisines': cuisines} );
  // Send back a message that we've succesfully written the message
  res.json({result: `User data updated.`});

});

exports.getUserConfig = functions.https.onRequest((req, res) => {

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  cors(req, res, () => {});
  const user = req.query.userName;
  db.collection('user_config').doc(user).get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
        res.send(doc.data());
      }
    })
    .catch(err => {
      console.log('Error getting document', err);
      res.send('Error fetching document!')
    });
});


exports.home = functions.https.onRequest((req, res) => {

  cors(req, res, () => {});

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  let cuisines = [];
  let randomCuisine = '';
  let offset = 0;

  const user = req.query.userName;
  console.log('USER: ', user);
  db.collection('user_config').doc(user).get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
        cuisines = doc.data().cuisines;
        console.log('Cuisines: ', cuisines);
        if(req.query.cuisine) {
          console.log('CUISINE: ',req.query.cuisine);
          randomCuisine = req.query.cuisine;
        } else {
          randomCuisine = cuisines[ Math.floor(Math.random() * cuisines.length) ];
          console.log('Random cuisine: ', randomCuisine);
        }

        offset = Math.floor(Math.random() * (10-1));
        console.log("OFFSET :", offset);

        // COMPLEX SEARCH BY TIME
        let quickRecipesPromise = axios.get(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${spoonacularKey}&number=10&maxReadyTime=10&addRecipeInformation=true&cuisine=${randomCuisine}&offset=${offset}`);

        console.log('Quick Recipes: ', quickRecipesPromise);

        let popularRecipesPromise = axios.get(`https://api.spoonacular.com/recipes/search?number=10&cuisine=${randomCuisine}&apiKey=${spoonacularKey}&offset=${offset}`);

        console.log('Pop Recipes: ', popularRecipesPromise);


        let allCuisines = [ 'African', 'American', 'British','Cajun','Caribbean','Chinese','Eastern European','European','French','German','Greek','Indian','Irish','Italian','Japanese','Jewish','Korean','Latin American','Mediterranean','Mexican','Middle Eastern','Nordic','Southern','Spanish','Thai','Vietnamese' ];

        Promise.all([quickRecipesPromise, popularRecipesPromise])
        .then( results => {
          console.log("PROMISE RESULTS: ",results);
          res.json({
            'quickRecipes': results[0].data,
            'popularRecipes': results[1].data,
            'cuisines': allCuisines
          });
        })
        .catch(err => {
          console.warn(err)
        })
      }
    })
    .catch(err => {
      console.warn('Error fetching document!')
    });
});

exports.searchRecipes = functions.https.onRequest((req, res) => {

  cors(req, res, () => {});

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  const searchQuery = req.query.searchQuery;
  axios.get(`https://api.spoonacular.com/recipes/autocomplete?number=1&query=${searchQuery}&apiKey=${spoonacularKey}`)
    .then( response => {
      const title = response.data[0].title;

      if(title) {
        axios.get(`https://api.spoonacular.com/recipes/search?number=5&query=${title}&apiKey=${spoonacularKey}`)
        .then( resp => {
          res.json( resp.data )
        })
        .catch( err => console.warn(err) );
      }
    })
    .catch( err => console.warn(err) );

}); // searchRecipes END

exports.getRecipeDetails = functions.https.onRequest((req, res) => {

  cors(req, res, () => {});

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  const recipeId = req.query.recipeId;
  console.log('RECIPE ID: ', recipeId);
  axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information?includeNutrition=true&apiKey=${spoonacularKey}`)
    .then( response => {
      console.log('RESPONSE: ', response);
      res.json( response.data );
    })
    .catch( err => console.warn(err) );

}); // getRecipeDetails END

exports.getSimilarRecipes = functions.https.onRequest((req, res) => {

  cors(req, res, () => {});

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  const recipeId = req.query.recipeId;
  console.log('RECIPE ID: ', recipeId);
  axios.get(`https://api.spoonacular.com/recipes/${recipeId}/similar?number=4&apiKey=${spoonacularKey}`)
    .then( response => {
      console.log('RESPONSE: ', response);
      res.json( response.data );
    })
    .catch( err => console.warn(err) );
});

exports.foodTrivia = functions.https.onRequest((req, res) => {

  cors(req, res, () => {});

  if (req.method !== "GET") {
   return res.status(401).json({
     message: "Not allowed"
   });
  }

  axios.get(`https://api.spoonacular.com/food/trivia/random?apiKey=${spoonacularKey}`)
    .then( response => {
      console.log('RESPONSE: ', response);
      res.json( response.data );
    })
    .catch( err => console.warn(err) );

});
