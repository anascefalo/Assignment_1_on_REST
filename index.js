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

mongoClient.connect(URL, config, function (error, dbManager) {
  if (error) {
    console.log("Connection failed");
  } else {
    console.log("Connection success");
    database = dbManager.db("Ass1_REST");
  }
});

async function authenticate(code) {
  code = code.substr(6); // removing the Basic prefix
  let user_pass = Buffer.from(code, "base64").toString("utf8").split(":"); // decode to userName and password

  let query = { userName: user_pass[0], password: user_pass[1] }; // here after split , user_pass is [userName, password]

  // check if user pass matched with any registered user record
  const table = database.collection("User");
  let data = await table.find(query).toArray();
  if (data.length == 0) {
    return null;
  } else {
    return query;
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
      res.send("Hello " + authData.userName + ", Welcome to postBook");
    }
  });
});

app.post("/post", async function (req, res) {
  let authData = await authenticate(req.headers.authorization);
  console.log("here is authdata ", authData);
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
