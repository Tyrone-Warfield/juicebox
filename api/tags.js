const express = require('express');
const tagsRouter = express.Router();


tagsRouter.get('/:tagName/posts', async (req, res, next) => {
      const { tagName } = req.params 
    try {
     
    } catch ({ name, message }) {
        next({ name, message });
    }
  });


tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  next(); 
});

tagsRouter.get('/', (req, res) => {

  res.send({
    tags: []
  });
});

module.exports = tagsRouter;