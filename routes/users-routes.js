const express = require("express");
const { check } = require("express-validator");

const usersControllers = require("../controllers/users-controllers");
const fileUpload = require('../middleware/file-upload.js')

const router = express.Router();

router.get("/", usersControllers.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersControllers.signup
);

router.post("/login", usersControllers.login);

module.exports = router;

// const express = require("express");

// const router = express.Router();

// const DUMMY_PLACES = [
//     {
//       id: "p1",
//       title: "Empire State Building",
//       description: "One of the most iconic landmarks in the world",
//       location: {
//         lat: 40.7484405,
//         lng: -73.9856654,
//       },
//       address: "350 5th Ave, New York, NY 10118, USA",
//         creator:'u1 '
//     },
//   ];

//   router.get("/:uid", (req, res, next) => {
//     const userId = req.params.uid;
//     const user = DUMMY_PLACES.find(u => {
//         return u.id === userId;
//     })
//       res.json({ user });
//     });

//     module.exports = router;
