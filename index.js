const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const multerObj = require("multer");
const multer = multerObj();

app.use(multer.array());
app.use(bodyParser.text({ type: "text/plain" }));
app.use(bodyParser.json({ type: "application/*+json" }));

const mongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;

const URL =
  "mongodb+srv://Anas:pikupiku@cluster0.1rs8u.mongodb.net/User?retryWrites=true&w=majority";

const config = { useUnifiedTopology: true };

let database = null;
let loggedIn = [];

mongoClient.connect(URL, config, function (error, dbManager) {
  if (error) {
    console.log("Connection failed");
  } else {
    console.log("Connection success");
    database = dbManager.db("Ass1_REST");
  }
});

function authenticate(authval) {
  for (let i = 0; i < loggedIn.length; i++) {
    let encoded =
      "Basic " +
      Buffer.from(loggedIn[i].userName + ":" + loggedIn[i].password).toString(
        "base64"
      );

    console.log("Encoded " + encoded);
    console.log("authval " + authval);
    if (encoded == authval) return loggedIn[i];
  }

  return null;
}

app.get("/", function (req, res) {
  res.send("Welcome to postBook......");
});

app.get("/unauth", function (req, res) {
  res.statusCode = 401;
  res.send("Please Loggin first......");
});

app.get("/all-posts", function (req, res) {
  const table = database.collection("Posts");

  table.find().toArray(function (error, data) {
    if (error) {
      res.send("Error while loading posts");
    } else {
      let posts = "";
      for (let i = 0; i < data.length; i++) posts += data[i].post + "\n";
      res.send("Here is all posts....now eat them (-_-)\n\n" + posts);
    }
  });
});

app.get("/posts/:userName", function (req, res) {
  let query = { userName: req.params.userName };
  const table = database.collection("Posts");
  console.log(query);
  table.find(query).toArray(function (error, data) {
    if (error) {
      res.send("Error while loading posts");
    } else {
      let posts = [];
      for (let i = 0; i < data.length; i++) posts.push(data[i].post);
      res.send(posts);
    }
  });
});

app.post("/register", function (req, res) {
  let authData = req.body;
  const table = database.collection("User");
  table.insert(authData, function (error) {
    if (error) {
      res.send("Oops!!  Registration failed .....");
    } else {
      res.statusCode = 201;
      res.send("Registration success! (^_^)");
    }
  });
});

app.post("/login", function (req, res) {
  let authData = req.body;
  let query = { userName: authData.userName, password: authData.password };
  const table = database.collection("User");

  table.find(query).toArray(function (error, data) {
    if (data.length == 0 || error) {
      res.send("Login failed");
    } else {
      loggedIn.push(authData);

      res.send("Hello " + authData.userName + ", Welcome to postBook");
    }
  });
});

app.post("/post", function (req, res) {
  let authData = authenticate(req.headers.authorization);
  if (!authData) {
    res.redirect("/unauth");
  } else {
    const table = database.collection("Posts");

    let data = { userName: authData.userName, post: req.body };

    table.insert(data, function (error) {
      if (error) {
        res.send("Oops!!  Couldn't post.....");
      } else {
        res.statusCode = 201;
        res.send("You've just posted this : " + req.body);
      }
    });
  }
});

app.delete("/post/:postID", function (req, res) {
  let authData = authenticate(req.headers.authorization);
  if (!authData) {
    res.redirect("/unauth");
  } else {
    const table = database.collection("Posts");

    let item = { _id: ObjectId(req.params.postID) };
    console.log(req.params.postID);
    table.deleteOne(item, function (error) {
      if (error) {
        res.send("Oops!!  Couldn't delete post.....");
      } else {
        res.send("Post deleted....");
      }
    });
  }
});

app.put("/update-post/:postID", function (req, res) {
  let authData = authenticate(req.headers.authorization);
  if (!authData) {
    res.redirect("/unauth");
  } else {
    const table = database.collection("Posts");

    let item = { _id: ObjectId(req.params.postID) };
    let updatedPost = { $set: { post: req.body } };
    console.log(req.params.postID);

    table.updateOne(item, updatedPost, function (error, data) {
      if (error) {
        res.send("Oops!!  Couldn't update post.....");
      } else {
        res.send("Post updated to : " + req.body);
      }
    });
  }
});

app.listen(111, function () {
  console.log("server is running");
});
