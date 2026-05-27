export default function Avatar({ user, size = 40, style = {} }) {
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const colors = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
  const colorIdx = user?.name
    ? user.name.charCodeAt(0) % colors.length
    : 0;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar.startsWith('http') ? user.avatar : user.avatar}
        alt={user.name}
        className="avatar"
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${colors[colorIdx]}, ${colors[(colorIdx + 1) % colors.length]})`,
        ...style
      }}
    >
      {initials}
    </div>
  );
}
