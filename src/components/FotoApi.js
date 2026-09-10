import { useEffect, useState } from "react";
import { getToken } from "../services/auth";

const API_URL = (process.env.REACT_APP_API_URL || "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\/$/, "");

function FotoApi({ arquivoId, className, alt, onClick }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!arquivoId) return undefined;

    const token = getToken();
    if (!token) return undefined;

    let objectUrl = null;
    let cancelado = false;

    fetch(`${API_URL}/arquivos/${arquivoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Foto indisponível");
        return r.blob();
      })
      .then((blob) => {
        if (cancelado) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelado) setSrc(null);
      });

    return () => {
      cancelado = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [arquivoId]);

  if (!src) {
    return (
      <div
        className={`${className || ""} bg-gray-800 flex items-center justify-center text-[10px] text-gray-500`}
        onClick={onClick}
      >
        ...
      </div>
    );
  }

  return <img src={src} className={className} alt={alt || "foto"} onClick={onClick} />;
}

export default FotoApi;
