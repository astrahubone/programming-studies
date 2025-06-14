import './Loading.scss';

export function Loading() {
  return (
    <div className="loading">
      <svg width="128px" height="96px" viewBox="0 0 64 48" preserveAspectRatio="xMidYMid meet">
        <polyline
          points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
          id="back"
        ></polyline>
        <polyline
          points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"
          id="front"
        ></polyline>
      </svg>
    </div>
  );
}
