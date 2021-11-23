//import du modele
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const Post = db.post;
const User = db.user;
const Like = db.like;
const Comment = db.comment;
const recupUserId = require("../middleware/recupUserIdWithToken");

exports.signup = (req, res) => {
  const userObject = JSON.parse(req.body.user);
  //Hashage du mot de passe
  bcrypt.hash(userObject.password, 10).then((hash) => {
    console.log(userObject);
    // Sauvegarde de l'user dans ma database



    User.create({
      lastName: userObject.lastName,
      firstName: userObject.firstName,
      password: hash,
      email: userObject.email,
      imageUrl:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      role: userObject.role,
      }
    )
      .then((user) => {
        res.status(200).send({
          status: true,
          message: "user created successfully",
        });
      })
      .catch((error) =>
        res
          .status(500)
          .send({ error, message: "Erreur lors du hashage du mot de passe" })
      );
  });
};

exports.login = (req, res, next) => {
  console.log(req.body);
  User.findOne({ where: { email: req.body.email } })
    .then((user) => {
      console.log(user);
      if (!user) {
        return res.status(401).send({
          error: "Utilisateur email=" + req.body.email + " introuvable",
        });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).send({ error: "Mot de passe incorrect" });
          }
          res.status(200).send({
            userId: user.id,
            token: jwt.sign({ userId: user.id }, "TOKEN_groupomania_1870", {
              expiresIn: "24h",
            }),
            role: user.role,
          });
        })
        .catch((error) =>
          res.status(500).send({
            error,
            message: "erreur lors de la vérification du mot de passe",
          })
        );
    })
    .catch((error) =>
      res.status(401).send({
        error,
        message: "Erreur lors de la recherche de l'utilisateur ",
      })
    );
};

exports.delete = (req, res) => {
  const userId = req.params.userId;

  User.destroy({ where: { id: userId } })
    .then(() => {
      res.status(200).send({
        status: true,
        message: "User deleted successfully with id = " + userId,
      });
    })
    .catch((error) =>
      res.status(500).send({
        message: "erreur lors de la suppression de l'utilisateur id=" + userId,
      })
    );
};

exports.update = (req, res) => {
  const userId = req.params.userId;
  const userObject = JSON.parse(req.body.user);
  bcrypt
    .hash(userObject.password, 10)
    .then((hash) => {
      const user = req.file
        ? {
          lastName: userObject.lastName,
          firstName: userObject.firstName,
          password: hash,
          email: userObject.email,
          imageUrl: `${req.protocol}://${req.get("host")}/images/user/${
            req.file.filename
          }`,
          role: userObject.role,
          }
        : {
          lastName: userObject.lastName,
          firstName: userObject.firstName,
          password: hash,
          email: userObject.email,
          role: userObject.role,
        };
      User.update(
        {
          user,
        },
        { where: { id: userId } }
      )
        .then(() => {
          res.status(200).json({
            status: true,
            message: "User updated successfully with id = " + userId,
          });
        })
        .catch((error) =>
          res.status(500).send({
            message:
              "erreur lors de la mise à jour des infos du user id=" + userId,
          })
        );
    })
    .catch((error) =>
      res.status(500).send({ message: "Erreur lors du cryptage du mdp" })
    );
};

exports.getOne = (req, res) => {
  const userId = req.params.userId;
  User.findOne({
    where: { id: userId },
    attributes: ["id", "lastName", "firstName", "email"],
    includes: [
      {
        model: Post,
        attributes: ["id", "title", "content", "createdAt"],
        includes: {
          model: Like,
        },
      },
      {
        model: Like,
      },
      {
        model: Comment,
        attributes: ["id", "content"],
        includes: {
          model: User,
          attributes: ["id", "lastName", "firstName"],
        },
      },
    ],
  })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .send({ error: "Utilisateur id=" + userId + " introuvable" });
      }
      res.status(200).send({ user });
    })
    .catch((error) => res.status(401).send({ error }));
};

exports.getAll = (req, res) => {
  User.findAll({
    attributes: ["id", "lastName", "firstName", "email", "role"],
  })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch((error) => res.status(401).send({ error }));
};
