const { Client } = require('pg');
const client = new Client('postgres://localhost:5432/juicebox-dev');


async function getAllUsers() {
    const { rows } = await client.query(
        `SELECT id, username, name, location, ACTIVE FROM users;`
    );
    return rows
}

async function createPost({
    authorid,
    title,
    content,
    tags = []
}) {
   const { authorid, title, content, tags} = createPost

     try {    const { rows: [ post ] } = await client.query (
        `INSERT INTO posts("authorid", title, content)
    VALUES ($1, $2, $3)
    ON CONFLICT (authorid) DO NOTHING 
    RETURNING *;
    `, [authorid, title, content ]);

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
} catch (error) {
    throw error;
}
}

async function createUser({ username, password, name, location }) {
    try {
        const { rows } = await client.query (
            `INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
        `, [username, password, name, location]);
        return rows
    } catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    try {
      const { rows: [ user ] } = await client.query(`
        SELECT id, username, name, location, active
        FROM users
        WHERE id=${ userId }
      `);
  
      if (!user) {
        return null
      }
  
      user.posts = await getPostsByUser(userId);
  
      return user;
    } catch (error) {
      throw error;
    }
  }

async function updateUser(id, fields = {}) {
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`).join(', ');
    
    if(setString.length === 0) {
        return;
    }
   
    try {
        const {rows: [user]} = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
   
      return user;
    } catch (error) {
        console.log("fialed to update user")
       throw error;
    }
   }

   async function updatePost(id, fields = {}) {

    const { tags } = fields;
    delete fields.tags


    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`).join(', ');
        
    
    if(setString.length === 0) {
        return;
    }
   
    try {
      if (setString.length > 0) {
        await client.query(`
          UPDATE posts
          SET ${ setString }
          WHERE id=${ postId }
          RETURNING *;
        `, Object.values(fields));
      }
  
       if (tags === undefined) {
         return await getPostId(postId);
       }

       const tagList = await createTags(tags);
       const tagListIdString = tagList.map(
         tag => `${ tag.id }`
       ).join(', ');

       await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId]);

     await addTagsToPost(postId, tagList);
   
      return await getPostById(postId);
    } catch (error) {
        console.log("fialed to update post")
       throw error;
    }
   }

   async function getAllPosts() {
    try {
      const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
      `);

      const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
      ));
  
  
      return posts;
    } catch (error) {
      throw error;
    }
  }
  
  async function getPostsByUser(userId) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT * 
        FROM posts
        WHERE "authorId"=${ userId };
      `);

      const posts = await Promise.all(postIds.map(
        post => getPostById( post.id )
      ));
  
  
      return posts;
    } catch (error) {
      throw error;
    }
  }

  async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  }

  
  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');
  

  
  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');
  
  try {`INSERT INTO tags(name)
    VALUES ($1), ($2), ($3)
    ON CONFLICT (name) DO NOTHING;`
    const {rows} = await client.query(`SELECT * FROM tags
    WHERE name
    IN ($1, $2, $3);`)
    
    return rows;
  } catch (error) {
    throw error;
  }
}


async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {


  if (!post) {
    throw {
      name: "PostNotFoundError",
      message: "Could not find a post with that postId"
    };
  }
  
  try {
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postId]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

async function getAllTags() {
  try {
    const { rows } = await client.query(`
    SELECT * FROM tags;
    `);

    


    return rows;
  } catch (error) {
    throw error;
  }

}

async function getUserByUsername(username) {
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE username=$1;
    `, [username]);

    return user;
  } catch (error) {
    throw error;
  }
}



module.exports = {
    client, getAllUsers, createUser, updateUser, createPost,updatePost,
    getAllPosts,
    getPostsByUser, getUserById, createTags, addTagsToPost, getPostById, addTagsToPost, getAllTags, getUserByUsername
};