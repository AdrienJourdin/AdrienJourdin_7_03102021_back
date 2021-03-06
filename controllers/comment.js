const db = require("../models");
const Post = db.post;
const User = db.user;
const Like = db.like;
const Comment = db.comment;
const recupUserId = require("../middleware/recupUserIdWithToken");

exports.create = (req, res) => {
  const userId = recupUserId.recupUserIdWithToken(req);
  const postId = req.params.postId;
  Post.findOne({ where: { id: postId } })
    .then((post) => {
      if (!post) {
        res
          .status(400)
          .send({ message: "Publication id=" + postId + " inconnue" });
      }
    })
    .catch((error) => {
      res.status(500).send({
        error,
        message: "Erreur lors de la recherche de la publication id=" + postId,
      });
    });
  Comment.create({
    content: req.body.content,
    userId: userId,
    postId: postId,
  })
    .then((comment) => {
      res.status(200).send({
        comment,
        message: "Votre commentaire a bien été publié",
      });
    })
    .catch((error) =>
      res.status(500).send({
        message: "Erreur lors de la publication de votre commentaire",
        error,
      })
    );
};

exports.delete = (req, res) => {
  const commentId = req.params.commentId;
  Comment.destroy({ where: { id: commentId } })
    .then((comment) => {
      if (!comment) {
        return res
          .status(400)
          .send({ message: "Commentaire id=" + commentId + " Introuvable" });
      } else {
        res.status(200).send({
          message: "Le commentaire id=" + commentId + " a bien été supprimé",
        });
      }
    })
    .catch((error) =>
      res
        .status(400)
        .send({ message: "Erreur lors de la suppresson du commentaire", error })
    );
};

exports.update = (req, res) => {
  const commentId = req.params.commentId;

  Comment.update(
    {
      content: req.body.content,
    },
    { where: { id: commentId } }
  )
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Mise a jour du commentaire id = " + commentId,
      });
    })
    .catch((error) =>
      res.status(500).send({
        message: "Erreur lors de la mise à jour du commentaire id=" + commentId,
        error,
      })
    );
};

exports.getOne = (req, res) => {
  const commentId = req.params.commentId;

  Comment.findOne({
    where: { id: commentId },
    attributes: ["id", "content", "createdAt"],
    include: {
      model: User,
      attributes: ["id", "lastName", "firstName"],
    },
  })
    .then((comment) => {
      if (!comment) {
        return res.status(401).send({
          error,
          message: "Commentaire id=" + commentId + " introuvable",
        });
      } else {
        res.status(200).send({ comment });
      }
    })
    .catch((error) =>
      res.status(401).send({
        error,
        message: "Erreur lors de la recherche du commentaire id=" + commentId,
      })
    );
};

exports.getAllforOnePost = (req, res) => {
  const postId = req.params.postId;
  //Recherche de l'existence du post
  Post.findOne({ where: { id: postId } })
    .then((post) => {
      if (!post) {
        return res.status(401).send({
          error,
          message: "Publication id=" + postId + " introuvable",
        });
      }
    })
    .catch((error) =>
      res.status(401).send({
        error,
        message: "Erreur lors de la recherche de la publication id=" + postId,
      })
    );

  Comment.findAll({
    attributes: ["id", "content"],
    order: [["createdAt", "DESC"]],
    include: {
      model: User,
      attributes: ["id", "lastName", "firstName"],
    },
    where: { postId: postId },
  })

    .then((comments) => {
      res.status(200).send(comments);
    })
    .catch((error) => {
      res.status(400).send({
        error,
        message:
          "erreur lors de la recherche des commentaires de la publication id=" +
          postId,
      });
    });
};
