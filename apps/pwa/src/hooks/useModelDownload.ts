import { useCallback, useEffect, useState } from "react";

type DownloadState = {
  cached: boolean;
  downloading: boolean;
  progress: number;
  error?: string;
};

const CACHE_NAME = "sm-models-v1";

async function isCached(url: string) {
  const cache = await caches.open(CACHE_NAME);
  const match = await cache.match(url);
  return Boolean(match);
}

export function useModelDownload(url: string) {
  const [state, setState] = useState<DownloadState>({
    cached: false,
    downloading: false,
    progress: 0
  });

  useEffect(() => {
    let mounted = true;
    isCached(url).then((cached) => {
      if (!mounted) return;
      setState((prev) => ({ ...prev, cached }));
    });
    return () => {
      mounted = false;
    };
  }, [url]);

  const download = useCallback(async () => {
    setState((prev) => ({ ...prev, downloading: true, error: undefined }));
    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error("Model download failed.");
      }
      const reader = response.body.getReader();
      const contentLength = Number(response.headers.get("Content-Length") ?? 0);
      let received = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          const progress = contentLength ? received / contentLength : 0;
          setState((prev) => ({ ...prev, progress }));
        }
      }
      const blob = new Blob(chunks);
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(blob));
      setState({ cached: true, downloading: false, progress: 1 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed.";
      setState((prev) => ({ ...prev, downloading: false, error: message }));
    }
  }, [url]);

  const clear = useCallback(async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);
    setState({ cached: false, downloading: false, progress: 0 });
  }, [url]);

  return { ...state, download, clear };
}
