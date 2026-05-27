import Post from "../models/Post.js";

// @desc Get all posts (feed)
// GET /api/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Create a post
// POST /api/posts
export const createPost = async (req, res) => {
  try {
    const { content, textEffect, bgColor } = req.body;

    if (!content && !req.file) {
      return res.status(400).json({ message: "Post must have content or an image" });
    }

    const post = await Post.create({
      user: req.user._id,
      content: content || "",
      image: req.file ? `/uploads/${req.file.filename}` : "",
      textEffect: textEffect || "none",
      bgColor: bgColor || "",
    });

    const populated = await post.populate("user", "name avatar");
    res.status(201).json(populated);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update a post
// PUT /api/posts/:id
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { content, textEffect, bgColor } = req.body;
    if (content !== undefined) post.content = content;
    if (textEffect) post.textEffect = textEffect;
    if (bgColor !== undefined) post.bgColor = bgColor;
    if (req.file) post.image = `/uploads/${req.file.filename}`;

    const updated = await post.save();
    await updated.populate("user", "name avatar");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Delete a post
// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Like / Unlike a post
// PUT /api/posts/:id/like
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked = post.likes.includes(req.user._id);
    if (liked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ likes: post.likes, liked: !liked });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Add comment
// POST /api/posts/:id/comment
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate("comments.user", "name avatar");

    res.status(201).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
