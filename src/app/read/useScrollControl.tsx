import {
  MutableRefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { WorkerContext } from '../aligner-worker/AlignerWorker';
import { useAddEventListener } from '../util/useAddEventListener';
import { useCollectionPositionLocalStorage } from '../util/useLocalStorage';

function calculateScroll(
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>
) {
  const page = pageRefs.current.reduce((prev, v, i): number => {
    if ((v?.getBoundingClientRect().bottom ?? 0) > 0) {
      return Math.min(prev, i);
    }
    return prev;
  }, pageRefs.current?.length ?? 0);

  const { top, bottom } = pageRefs.current[page]?.getBoundingClientRect() ?? {
    top: 0,
    bottom: 0,
  };
  const percentage = top >= 0 ? 0 : top / (top - bottom);
  return { page, percentage };
}

function scrollToPosition(
  page: number,
  percentage: number,
  pageRefs: MutableRefObject<(HTMLDivElement | null)[]>,
  scrollingRef: MutableRefObject<{
    scrolling: boolean;
    adjusting: boolean;
  }> | null
) {
  const targetDiv = pageRefs.current[page];
  if (targetDiv) {
    const targetRect = targetDiv.getBoundingClientRect();
    const scrollByTop = targetRect.top + targetRect.height * percentage;
    if (scrollByTop !== 0) {
      if (scrollingRef) scrollingRef.current.adjusting = true;
      window.scrollBy({
        top: scrollByTop,
        behavior: 'instant',
      });
    }
  }
}

export function useScrollControl(
  collectionName: string | undefined,
  origPageCount: number | null,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  pageRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
) {
  const [currentPage, setCurrentPage] = useState({ page: 0, percentage: 0 });
  const localStorageCurrentPage =
    useCollectionPositionLocalStorage(collectionName);

  const { inProgress } = useContext(WorkerContext);

  const scrollingRef = useRef({ scrolling: false, adjusting: false });

  const stepPage = useCallback(
    (amount: number) => {
      const calculatedPosition = calculateScroll(pageRefs);
      scrollToPosition(
        Math.min(
          Math.max(0, calculatedPosition.page + amount),
          (origPageCount ?? 1) - 1
        ),
        0,
        pageRefs,
        null
      );
    },
    [origPageCount, pageRefs]
  );
  const keyPressHandler = useCallback(
    (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'a') stepPage(-1);
      else if (ev.key === 'ArrowRight' || ev.key === 'd') stepPage(1);
      else return;
      ev.preventDefault();
    },
    [stepPage]
  );
  useAddEventListener('keydown', keyPressHandler);

  const scrollHandler = useCallback(
    (_event: Event) => {
      setCurrentPage(calculateScroll(pageRefs));
      scrollingRef.current.scrolling = true;
    },
    [pageRefs]
  );
  useAddEventListener('scroll', scrollHandler);

  const scrollendHandler = useCallback(
    (_event: Event) => {
      if (!scrollingRef.current.adjusting) {
        localStorageCurrentPage.setValue(calculateScroll(pageRefs));
      }
      scrollingRef.current = { scrolling: false, adjusting: false };
    },
    [pageRefs]
  ); // setter dep unneeded localStorageCurrentPage.setValue
  useAddEventListener('scrollend', scrollendHandler);

  useLayoutEffect(() => {
    let firstCall = true;
    function scrollToSavedPosition() {
      if (firstCall) {
        firstCall = false;
        return;
      }

      if (
        localStorageCurrentPage.value === null ||
        (inProgress === collectionName && scrollingRef.current.scrolling)
      ) {
        return;
      }

      const containers = pageRefs.current.map(
        (element) =>
          element?.getBoundingClientRect() ?? { top: 0, bottom: 0, height: 0 }
      );
      if (containers.some((rect) => rect.height === 0)) return;

      scrollToPosition(
        localStorageCurrentPage.value.page,
        localStorageCurrentPage.value.percentage,
        pageRefs,
        scrollingRef
      );
    }

    const observer = new ResizeObserver(scrollToSavedPosition);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [
    collectionName,
    localStorageCurrentPage.value?.page,
    localStorageCurrentPage.value?.percentage,
    inProgress,
  ]);

  return { currentPage, setCurrentPage, localStorageCurrentPage, scrollingRef };
}
