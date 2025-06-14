import { useWindowSize } from "../useWindowSize";

export function useIsMobile(): boolean{
    const { width } = useWindowSize()
    return !!width && width < 768
}

export default useIsMobile