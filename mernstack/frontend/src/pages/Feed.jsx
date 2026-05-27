import { useState, useEffect } from 'react';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import api from '../utils/api';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/posts');
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px 40px' }}>
      <h2 style={{
        fontSize: 24, fontWeight: 700, marginBottom: 20,
        background: 'var(--gradient)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        Your Feed ✨
      </h2>

      <CreatePost onPostCreated={handlePostCreated} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }} className="card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
          <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
}
