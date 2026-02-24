import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';

const QRCodeCard = () => {
  const menuUrl = window.location.origin;
  const svgRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    toast.success('Link copiado!');
  };

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = 'qrcode-cardapio.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" /> QR Code do Cardápio
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={svgRef} className="bg-white p-4 rounded-xl">
          <QRCodeSVG
            value={menuUrl}
            size={200}
            level="H"
            includeMargin
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Imprima este QR code para seus clientes acessarem o cardápio digital
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
          >
            <Download className="h-4 w-4" /> Baixar PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <Copy className="h-4 w-4" /> Copiar Link
          </button>
        </div>
        <p className="text-xs text-muted-foreground break-all text-center">{menuUrl}</p>
      </CardContent>
    </Card>
  );
};

export default QRCodeCard;
