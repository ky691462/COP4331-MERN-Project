import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QR code that opens the site with the room code filled in.
function JoinQR({ code }: { code: string }) {
  const [svg, setSvg] = useState('');
  const url = `${window.location.origin}/home?join=${encodeURIComponent(code)}`;

  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#15133b', light: '#ffffff' } })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [url]);

  if (!svg) return null;

  return (
    <figure className="qr">
      <div className="qr-img" role="img" aria-label={`QR code to join room ${code}`}
        dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>Scan with a phone camera to join</figcaption>
    </figure>
  );
}

export default JoinQR;
