"use client";

import { useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";

export default function ExportBracketImage({
  children,
}: {
  children: ReactNode;
}) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");

  async function descargarImagen() {
    if (!posterRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      setMessage("Preparando imagen en alta resolución...");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const node = posterRef.current;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#071113",
        width: node.scrollWidth,
        height: node.scrollHeight,
        style: {
          width: `${node.scrollWidth}px`,
          height: `${node.scrollHeight}px`,
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.download = `cuadro-final-escalerilla-${date}.png`;
      link.href = dataUrl;
      link.click();

      setMessage("Imagen descargada correctamente.");
    } catch (error) {
      console.error(error);
      setMessage(
        "No se pudo generar la imagen. Intenta nuevamente. Si el problema persiste, puede ser por alguna foto externa sin permisos CORS."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="share-export-shell">
      <div className="share-toolbar">
        <div>
          <span>Imagen para compartir</span>
          <strong>Cuadro final en alta resolución</strong>
          <small>
            Formato horizontal 2400 × 1350. La descarga se genera en mayor
            densidad para que se vea nítida en WhatsApp y redes.
          </small>
        </div>

        <button type="button" onClick={descargarImagen} disabled={isDownloading}>
          {isDownloading ? "Generando..." : "Descargar PNG"}
        </button>
      </div>

      {message && <p className="share-message">{message}</p>}

      <div className="poster-scroll">
        <div ref={posterRef} className="poster-capture">
          {children}
        </div>
      </div>
    </div>
  );
}
