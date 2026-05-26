export default function Spinner({ size = 28, color = '#03bb85' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid rgba(3,187,133,.12)`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin .75s linear infinite',
    }} />
  );
}
