import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import api from '../utils/api';

function TextWithEffect({ text, effect }) {
  if (!text) return null;
  if (effect === 'wave') {
    return (
      <p className="text-effect-wave" style={{ fontSize: 16, lineHeight: 1.6 }}>
        {text.split('').map((char, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.05}s` }}>{char === ' ' ? '\u00A0' : char}</span>
        ))}
      </p>
    );
  }
  return (
    <p className={effect !== 'none' ? `text-effect-${effect}` : ''} style={{ fontSize: 16, lineHeight: 1.6 }}>
      {text}
    </p>
  );
}

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const toast = useToast();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    try {
      const { data } = await api.put(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikeCount(data.likes.length);
    } catch {
      toast('Failed to like post', 'error');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: comment });
      setComments(data);
      setComment('');
    } catch {
      toast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post._id}`);
      toast('Post deleted');
      onDelete?.(post._id);
    } catch {
      toast('Failed to delete', 'error');
      setDeleting(false);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="card fade-in" style={{ marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar user={post.user} size={42} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{post.user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
          </div>
        </div>
        {post.user?._id === user?._id && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleDelete}
            disabled={deleting}
            style={{ color: 'var(--error)' }}
          >
            {deleting ? '...' : '🗑️'}
          </button>
        )}
      </div>

      {/* Content */}
      {post.bgColor ? (
        <div style={{
          background: post.bgColor, borderRadius: 12, padding: '24px 20px',
          marginBottom: 12, textAlign: 'center'
        }}>
          <TextWithEffect text={post.content} effect={post.textEffect} />
        </div>
      ) : (
        post.content && (
          <div style={{ marginBottom: post.image ? 12 : 0 }}>
            <TextWithEffect text={post.content} effect={post.textEffect} />
          </div>
        )
      )}

      {/* Image */}
      {post.image && (
        <div style={{ marginBottom: 12, borderRadius: 12, overflow: 'hidden', marginLeft: -20, marginRight: -20 }}>
          <img src={post.image} alt="post" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLike}
          style={{ color: liked ? '#ec4899' : 'var(--text-muted)', fontWeight: liked ? 700 : 400 }}
        >
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowComments(!showComments)}
          style={{ color: 'var(--text-muted)' }}
        >
          💬 {comments.length}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 12 }}>
          {comments.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Avatar user={c.user} size={30} />
              <div style={{ background: 'var(--bg-hover)', borderRadius: 10, padding: '8px 12px', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.user?.name}</div>
                <div style={{ fontSize: 14 }}>{c.text}</div>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Avatar user={user} size={30} />
            <input
              className="input"
              style={{ padding: '8px 12px', fontSize: 14, borderRadius: 10 }}
              placeholder="Write a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
              {submitting ? '...' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
