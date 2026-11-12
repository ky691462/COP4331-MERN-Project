// The logo: the name spelled in letter tiles. One tile is the impostor.
const LETTERS = ['I', 'M', 'P', 'O', 'S', 'T', 'O', 'R'];
const ODD = 3; // the first O

function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`wordmark wordmark-${size}`} role="img" aria-label="Impostor">
      {LETTERS.map((ch, i) => (
        <span key={i} className={i === ODD ? 'tile tile-odd' : 'tile'} aria-hidden="true">
          {ch}
        </span>
      ))}
    </span>
  );
}

export default Wordmark;
