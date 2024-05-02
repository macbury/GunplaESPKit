import { useMediaQuery } from "@mantine/hooks";

export function useIsMobile() {
  return useMediaQuery('(max-width: 50em)');
}
