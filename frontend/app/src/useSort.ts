import { useMemo } from "react";

// Types
import { SortTypes } from "@liquity2/uikit";

interface UseSortProps {
  sortBy: string | null; // SortByKeys
  sort: SortTypes | null;
  data: any[];
  sortByDefault?: string; // SortByKeys | ''
  sortFn?: (a: any, b: any, subFn: (a: any, b: any) => number) => number;
}

export function useSort({
  sortBy,
  sort,
  data,
  sortFn,
  sortByDefault = "",
}: UseSortProps) {
  return useMemo(() => {
    const dataCopy = [...data];

    const defaultSort = (sortBy: string, sort: SortTypes) => (a: any, b: any) => {
      if (typeof a[sortBy] !== "bigint" && isNaN(+a[sortBy]!)) {
        return 1;
      }

      if (typeof b[sortBy] !== "bigint" && isNaN(+b[sortBy]!)) {
        return -1;
      }

      return (Number(a[sortBy]!) - Number(b[sortBy]!)) * sort;
    };

    if (!(sortBy && sort)) {
      if (sortByDefault !== "") {
        return data
          .slice()
          .sort(
            sortFn
              ? (a, b) => sortFn(a, b, defaultSort(sortByDefault, SortTypes.DESC))
              : defaultSort(sortByDefault, SortTypes.DESC),
          );
      }
      return dataCopy;
    }

    const defaultSortFilled = defaultSort(sortBy, sort);

    return dataCopy.sort(
      sortFn ? (a, b) => sortFn(a, b, defaultSortFilled) : defaultSortFilled,
    );
  }, [data, sortBy, sort, sortByDefault]);
}
