// Shows a room code as letter tiles, matching the logo.
function CodeTiles({ code }: { code: string }) {
  return (
    <span className="code-tiles" role="text" aria-label={`Room code ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => (
        <span key={i} className="tile" aria-hidden="true">{ch}</span>
      ))}
    </span>
  );
}

export default CodeTiles;
