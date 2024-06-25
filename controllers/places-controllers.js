const { v4: uuidv4 } = require("uuid");
const fs = require('fs')
const { validationResult, check } = require("express-validator");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Places = require("../models/place");
const Users = require("../models/user");
const mongoose = require("mongoose");


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Places.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id ",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByuserId = async (req, res, next) => {
  const userId = req.params.uid;

  // req.params.uid basically just extract the parameter part of the url passed which is its id , which is given through the url so we need to get that id out of the url

  // let places;
  let userWithPlaces
  try {
    userWithPlaces = await Users.findById(userId).populate('places');
    console.log(userWithPlaces)
    if(!userWithPlaces){
      const error = new HttpError(
        "Could not find a user for the provided id ",
        404
      );
      return next(error);
    }
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Fetching places failed, please try again",
      500
    );
    return next(error);
  }
  if (!userWithPlaces || userWithPlaces?.places?.length === 0) {
    return next(
      new HttpError("Could not find a places for the provided user id ", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) => place.toObject({ getters: true })),
  });
};

const createdPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address,creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Places({
    title,
    description,
    address,
    location: coordinates,
    image:req.file.path,
    creator:req.userData.userId
  });

  let user;
  console.log('creator',creator)
  try {
    user = await Users.findById(req.userData.userId);
    console.log(user)
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  console.log(user);
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  

  let place;
  try {
    place = await Places.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  if(place.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      "You are not allowed to edit this place.",
      401
    );
    return next(error);
  }
  

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  console.log("done");

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Places.findById(placeId).populate("creator");
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Something went wrong, could not delete place 1 .",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if(place.creator.id !== req.userData.userId){
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
      );

  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err)
    const error = new HttpError(
      "Something went wrong, could not delete place 2.",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err =>{
    console.log(err)
  });

  res.status(200).json({ message: "Deleted place . " });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByuserId = getPlacesByuserId;
exports.createPlace = createdPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
