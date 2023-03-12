import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { stringToHash, varifyHash } from "bcrypt-inzi";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import fs from "fs";
import multer from "multer";
import admin from "firebase-admin";
import bodyParser from "body-parser";


// app.use(express.urlencoded({ extended: true }));
const port = process.env.port || 3001;
const SECRET = process.env.SECRET || "topsecret";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ecommrace-web-app.up.railway.app",
      "*",
    ],

    credentials: true,
  })
);

let dbURI =
  process.env.MONGOOSEDBURI ||
  "mongodb+srv://abc:abc@cluster0.olyure1.mongodb.net/MernEcommrace?retryWrites=true&w=majority";
  
  
mongoose.connect(dbURI);

let userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  secondName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  createOn: { type: Date, default: Date.now },
});
const userModel = mongoose.model("User", userSchema);

let productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  discription: { type: String },
  quantity: { type: Number, required: true },
  createdBy: { type: String, required: true },
  file: { type: String, required: true },
  count: { type: Number },
  createOn: { type: Date, default: Date.now },
});
const productModel = mongoose.model("product", productSchema);


var serviceAccount = {
  type: "service_account",
  project_id: "fileupload-1a44e",
  private_key_id: "6a610f92ebfcd22f25f6bdb6105a5d34fd88270e",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC61d/JWXHePh1Z\nw7fBqfeVExnIK8QPyu0Avy8wwPg7BuRjqV4qlMx+Gt/76vh495ymbGVDOINToaut\nxqHUwn5ra3z/Rj7WgN4oN4L4h4wjheOxFQjTPeqc5SxRLlJ9z18YIDaKDrXTsSF+\nddV4g4/mqwLQZU3o5iUezLCynzV/gBKkyTN3XhorrxtP5au9Ag8z4iJQDUiIXKYs\nUKhd3Ja8VceFYZhnkFgVeIrInObpRy9Arh4TYqYTHtJNdKCl6DyXMpX95dSQTwy8\n5Qicndm1C6kwBRzUeedc3Tt7NdB7jvPwNwfIeAnMscolBmB3SRavZUSU19OTjy6K\nVu3DgPphAgMBAAECggEATW3FSJSg9BGZ6FGMHd5qlIVN8f7xSfo3LlANJo9SUGQS\n0pqmQ89W0AwjNyuxvbAgY3gYnzsUcdxWYbYn6xyPd8UcEE70S8EsUE5xIL5L/YzH\nR+QHvEO0r0DqlNo1pZ4DMuRmteBSymBmGRqMVV1wjY/hoqvZFeQLDjCWKfCBI00i\nssCcvP5zA/Gg8ePVmsoK0VKOxWWsA4zUwndZ7IUl05fyHjtLJA0NYd6cg5+D0jMH\n8//O5C4OS6eUwrTKwn3B7Q107ANkS1vHEnBi59cuk5G/xLtfOmN5Mbfs5G4GNtml\nzZy7GlvDttodDFeYmxMT/qcg80ZmfSYlXUJaV6Hd4QKBgQDqw0sitmaQ26sDHCld\n3pz2/bgjDsQhATtvIQCWS8JYA+IcUpRFuJhfMTLHfuIlsOGZkygSIcWbPfdj0HKr\nG5B8NiqDHGt9huOTj4TKWFZqkdaj0KhDHYKM8DhY33RUD13H+Qem857jseIMoVYu\n/XZ4GhkEZ9ZbNSnUAoy47l1XwwKBgQDLvKnhbAfmMGClU7zWNsXcnCLoe67JfH1b\nZWINDrfRwNfAtL/QA0UFy827ufg3D+pG9tHNK1O5rkPa+XyXcRPFGmIDaK0VrCSl\nJ7nGJPdecnRntwd0ZDiyEkxfcCTrmVxpDPQHG6oJ9Dl/K0USTvU9OBFc9TZP/lyV\nPSQ+Y+qnCwKBgQCFK3MbpcxYr8M6aGcu0HDJyvMBMAchkcldKKNknmUH+GvzFQT2\n59fHZ+keMWOnbccLjuZUIsQtY+FJxZzGY0R6sV88MIrpEfNWaTsybRnYKhJPqrVI\nHR1JRZsxDtC2PmE8Zo9orRmcn/NSptJ0pWLmjidS0HRQGMA5e5jH7q8UcQKBgQCy\nhnBJ4lMNpuiZFkZLYxWAGaURGIfxcE+cTbtce8AhYZzs9LV7fdH2oT52uB/DiAOf\nCVqQMN4dv5EgCSvevCw5s8Oc/xVj/0LhIW1NLklAjoRn+V7j44o2p4gavPbtJ6Zt\nOvd+XwRh0oqrX2wX/e4xJbc5QHnGILpZ34ipzv3oPwKBgQCktHhj5YrqfLDdNBlE\nirnLJ+NEDA3i/BHIS9Mlqc0Z/5P33EV9tuNcVV77NLuLqHgMIfeBfMDL2biWxmp0\n1mmIwl6nfsK++LgFnHSGvmIBC7QXiXxoQgJ8c4onYkXK0lgOfReNmMxGvmsRFeRJ\ndTyLJdoZJbsoGU1aJRf3aGpfAw==\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-t7svu@fileupload-1a44e.iam.gserviceaccount.com",
  client_id: "102630454630107679051",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-t7svu%40fileupload-1a44e.iam.gserviceaccount.com",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fileupload-1a44e.firebaseio.com",
});
const bucket = admin.storage().bucket("gs://fileupload-1a44e.appspot.com");

const storageConfig = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    console.log("mul-file: ", file);
    cb(null, `${new Date().getTime()} - ${file.originalname}`);
  },
});

const upload = multer({ storage: storageConfig });

// login code

app.post("/login", (req, res) => {
  let body = req.body;
  console.log("body", body);

  if (!body.email || !body.password) {
    // null check - undefined, "", 0 , false, null , NaN
    res.status(400).send(
      `required fields missing, request example: 
                {
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
    );
    return;
  }

  // check if user already exist // query email user
  userModel.findOne(
    { email: body.email },
    // { email:1, firstName:1, lastName:1, age:1, password:0 },
    "email firstName secondName role password",
    (err, data) => {
      if (!err) {
        console.log("data: ", data);

        if (data) {
          // user found
          varifyHash(body.password, data.password).then((isMatched) => {
            console.log("isMatched: ", isMatched);

            if (isMatched) {
              //  JWT token

              var token = jwt.sign(
                {
                  _id: data._id,
                  email: data.email,
                  iat: Math.floor(Date.now() / 1000) - 30,
                  exp: Math.floor(Date.now() / 1000) + 60 * 60,
                },
                SECRET
              );

              console.log("token :", token);
              //token send on cookies
              res.cookie("token", token, {
                maxAge: 86_400_00,
                httpOnly: true, //httpOnly cookies most secure
              });

              res.send({
                message: "login successful",
                profile: {
                  email: data.email,
                  firstName: data.firstName,
                  secondName: data.secondName,
                  role: data.role,
                  _id: data._id,
                },
              });
              return;
            } else {
              console.log("user not found");
              res.status(401).send({ message: "Incorrect email or password" });
              return;
            }
          });
        } else {
          // user not already exist
          console.log("user not found");
          res.status(401).send({ message: "Incorrect email or password" });
          return;
        }
      } else {
        console.log("db error: ", err);
        res.status(500).send({ message: "login failed, please try later" });
        return;
      }
    }
  );
});

// logout app

app.post("/logout", (req, res) => {
  let body = req.body;

  res.cookie("token", "", {
    maxAge: 0,
    httpOnly: true,
  });

  res.send({
    message: "logout successful",
  });
});

// signup api

app.post("/signup", (req, res) => {
  let body = req.body;
  if (!body.firstName || !body.secondName || !body.email || !body.password || !body.role) {
    res.status(400).send(
      `required field missing, request example :
      {
          firstName :"john"
          secondName :"doe"
          email  :"abd@abc.com
          password :"12345"
      }`
    );
    return;
  }

  // check if user already exist // query email user

  userModel.findOne({ email: body.email }, (err, user) => {
    if (!err) {
      console.log("user");

      if (user) {
        //user already exist
        console.log("user already exist :", user);
        res
          .status(400)
          .send({ message: "user already exist,,Please try deffrent email" });
        return;
      } else {
        //user not already exist

        stringToHash(body.password).then((hashString) => {
          userModel.create(
            {
              firstName: body.firstName,
              secondName: body.secondName,
              role: body.role,
              email: body.email.toLowerCase(),
              password: hashString,
            },
            (err, result) => {
              if (!err) {
                console.log("data saved:", result);
                res.status(201).send({ message: "user is created" });
              } else {
                console.log("db error: ", err);
                res.status(500).send({ message: "internal server error" });
              }
            }
          );
        });
      }
    } else {
      console.log("db error: ", err);
      res.status(500).send({ message: "db error in query" });
      return;
    }
  });
});

// all products

app.get("/product", async (req, res) => {
  console.log("product recived :", req.body);

  try {
    let products = await productModel.find({}).exec();

    console.log("all product", products);

    res.send({
      message: "all product",
      data: products,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to get product",
    });
  }
});




// secure apis
// every request will go through this check post
// middle ware

app.use(function (req, res, next) {
  console.log("req.cookies ", req.cookies.token);

  if (!req.cookies.token) {
    res.status(401).send("include http-only crediential with every request");

    return;
  }
  jwt.verify(req.cookies.token, SECRET, function (err, decodedData) {
    if (!err) {
      console.log("decodedData :", decodedData);

      const nowDate = new Date().getTime() / 1000;

      if (decodedData.exp < nowDate) {
        //expire after 5 min (in milis)
        res.status(401).send("token expired");
      } else {
        // issue new token
        // var token = jwt.sign(
        //   {
        //     id: decodedData.id,
        //     name: decodedData.name,
        //     email: decodedData.email,
        //   },
        //   SERVER_SECRET
        // );
        // res.cookie("jToken", token, {
        //   maxAge: 86_400_00,
        //   httpOnly: true,
        // });

        console.log("token approved");
        req.body.token = decodedData;
        next();
      }
    } else {
      res.status(401).send("invalid token");
    }
  });
});

//get profile
app.get("/profile", async (req, res) => {
  console.log("req.body.token:", req.body.token);
  try {
    let user = await userModel.findOne({ _id: req.body.token._id }).exec();
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: "error getting users" });
  }
});

// edit profile
app.put("/profile/:id", async (req, res) => {
  console.log("data to be edited  :", req.body);

  let pupdate = {};
  if (req.body.firstName) pupdate.firstName = req.body.firstName;
  if (req.body.secondName) pupdate.secondName = req.body.secondName;
  if (req.body.age) pupdate.age = req.body.age;
  if (req.body.gender) pupdate.gender = req.body.gender;

  try {
    let updated = await userModel
      .findOneAndUpdate({ _id: req.params.id }, pupdate, { new: true })
      .exec();
    console.log("profile updated", updated);

    res.send({
      message: "profile updated seccesfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to updated profile",
    });
  }
});

app.get("/users", async (req, res) => {
  console.log("users recived :", req.body);

  try {
    let users = await userModel.find({}).exec();

    console.log("all users", users);

    res.send({
      message: "all users",
      data: users,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to get users",
    });
  }
});











app.post("/product", upload.any(), async (req, res) => {
  console.log("prouct received: ", req.files);
  try {
    bucket.upload(
      req.files[0].path,
      {
        destination: `productPicture/${req.files[0].filename}`,
      },

      function (err, file, apiResponse) {
        if (!err) {
          file
            .getSignedUrl({
              action: "read",
              expires: "03-09-2491",
            })
            .then(async (urlData, err) => {
              if (!err) {
                console.log("public downloadable url: ", req.body.createdBy);

                const newProduct = new productModel({
                  file: urlData[0],
                  name: req.body.name,
                  quantity: req.body.quantity,
                  discription: req.body.discription,
                  price: req.body.price,
                  createdBy: req.body.createdBy,
                });

                await newProduct.save();
                try {
                  fs.unlinkSync(req.files[0].path);
                  //file removed
                } catch (err) {
                  console.error(err);
                }
                res.send({
                  message: "product added",
                  data: "Product created successfully",
                });
              }
            });
        } else {
          console.log("err: ", err);
          res.status(500).send(err);
        }
      }
    );
  } catch (error) {
    console.log("error", error);
    res.status(500).send({
      message: "faild to added product",
    });
  }
});

// single product
app.get("/product/:id", async (req, res) => {
  console.log("product: ", req.body);

  try {
    let product = await productModel.findOne({ _id: req.params.id }).exec();

    console.log("product", product);

    res.send({
      message: "product ",
      data: product,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to get product",
    });
  }
});

app.put("/product/:id", async (req, res) => {
  console.log("data to be edited  :", req.body);

  let update = {};
  if (req.body.quantity) update.quantity = req.body.quantity;
  if (req.body.name) update.name = req.body.name;
  if (req.body.discription) update.discription = req.body.discription;
  if (req.body.price) update.price = req.body.price;
  if (req.body.code) update.code = req.body.code;

  try {
    let updated = await productModel
      .findOneAndUpdate({ _id: req.params.id }, update, { new: true })
      .exec();
    console.log("product updated", updated);

    res.send({
      message: "product updated seccesfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to updated product",
    });
  }
});

//deleate product

app.delete("/product/:id", async (req, res) => {
  console.log("data to be edited  :", req.body);

  try {
    let deleted = await productModel.deleteOne({ _id: req.params.id }).exec();
    console.log("product deleted", deleted);

    res.send({
      message: "product deleted seccesfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to deleted product",
    });
  }
});

app.delete("/User/:id", async (req, res) => {
  console.log("data to be edited  :", req.body);

  try {
    let deleted = await userModel.deleteOne({ _id: req.params.id }).exec();
    console.log("User deleted", deleted);

    res.send({
      message: "User deleted seccesfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).send({
      message: "falled to deleted User",
    });
  }
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on("connected", function () {
  //connected
  console.log("Mongoose is connected");
});

mongoose.connection.on("disconnected", function () {
  //disconnected
  console.log("Mongoose is disconnected");
  process.exit(1);
});

mongoose.connection.on("error", function (err) {
  //any error
  console.log("Mongoose connection error: ", err);
  process.exit(1);
});

process.on("SIGINT", function () {
  /////this function will run jst before app is closing
  console.log("app is terminating");
  mongoose.connection.close(function () {
    console.log("Mongoose default connection closed");
    process.exit(0);
  });
});
