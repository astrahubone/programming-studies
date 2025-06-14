import { useEffect, useState } from "react";
import { ScreenSize } from "./useWindowSize.types";

export function useWindowSize(callback?: () => void) {
  const [windowSize, setWindowSize] = useState<ScreenSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      if (callback) callback();
    }
    window.addEventListener("resize", handleResize);

    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
