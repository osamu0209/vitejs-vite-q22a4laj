
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

type GameItem = {
  name: string;
  emoji: string;
  point: number;
  weight: number;
  special?: boolean;
};

const ITEM_TYPES: GameItem[] = [
  { name: "バラの花", emoji: "🌹", point: 1, weight: 18 },
  { name: "ドーナッツ", emoji: "🍩", point: 10, weight: 18 },
  { name: "弁当", emoji: "🍱", point: 30, weight: 15 },
  { name: "シャンパン", emoji: "🍾", point: 100, weight: 10 },
  { name: "ライオン", emoji: "🦁", point: 500, weight: 2, special: true },
  { name: "流れ星", emoji: "🌠", point: 1000, weight: 1, special: true },
  { name: "無料リクエスト", emoji: "🎤", point: -10, weight: 12 },
  { name: "ファンの怒り", emoji: "💢", point: -200, weight: 5 },
];

const RANKS = [
  { min: 2000, name: "物好きすぎる神", comment: "バンザーイ！バンザーイ！", emoji: "👑" },
  { min: 1000, name: "金払いのいい常連", comment: "アリガタイカギリデゴザイマスヨ！", emoji: "💎" },
  { min: 700, name: "普通すぎる常連", comment: "アザマス、アザマス", emoji: "💙" },
  { min: 300, name: "仕方なく掛け持ち", comment: "チョット、イカナイデー！！", emoji: "🥺" },
  { min: 50, name: "血迷った新規", comment: "ショケンサンダイカンゲイ！", emoji: "🌸" },
  { min: -99, name: "素晴らしきアンチ", comment: "ウワー、マタキヤガッタ！", emoji: "😈" },
  { min: -Infinity, name: "シンプルに出禁", comment: "アクリョウタイサン！アクリョウタイサン！", emoji: "💀" },
];

function getRank(score: number) {
  return RANKS.find((rank) => score >= rank.min)!;
}

function App() {
  const [status, setStatus] = useState<"ready" | "playing" | "ended">("ready");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentItem, setCurrentItem] = useState<GameItem | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [message, setMessage] = useState("アイドルに応援を届けよう！");
  const [lastPoint, setLastPoint] = useState<number | null>(null);

  const lionCount = useRef(0);
  const starCount = useRef(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const throwTimer = useRef<number | null>(null);
  const messageTimer = useRef<number | null>(null);
  const gameEndRef = useRef(false);

  // ランダムアイテム抽選
  const createRandomItem = (): GameItem => {
    const available = ITEM_TYPES.filter((item) => {
      if (item.name === "ライオン" && lionCount.current >= 3) return false;
      if (item.name === "流れ星" && starCount.current >= 1) return false;
      return true;
    });

    const pool = available.flatMap((item) =>
      Array(item.weight).fill(item)
    );

    const selected = pool[Math.floor(Math.random() * pool.length)];

    if (selected.name === "ライオン") lionCount.current++;
    if (selected.name === "流れ星") starCount.current++;

    return selected;
  };

  // ゲーム開始
  const startGame = () => {
    if (throwTimer.current !== null) {
      window.clearTimeout(throwTimer.current);
    }
    if (messageTimer.current !== null) {
      window.clearTimeout(messageTimer.current);
    }

    lionCount.current = 0;
    starCount.current = 0;
    gameEndRef.current = false;

    setScore(0);
    setTimeLeft(60);
    setThrowing(false);
    setLastPoint(null);
    setMessage("アイドルに応援を届けよう！");
    setCurrentItem(createRandomItem());
    setStatus("playing");
  };

  // ゲーム終了
  useEffect(() => {
    if (status !== "playing") return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          gameEndRef.current = true;
          setStatus("ended");
          setThrowing(false);
          setCurrentItem(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  // アイテムを投げる
  const throwItem = () => {
    if (status !== "playing" || throwing || !currentItem) return;

    setThrowing(true);
    setMessage("届けーっ！！");
    setLastPoint(null);

    const item = currentItem;

    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    throwTimer.current = window.setTimeout(() => {
      if (gameEndRef.current) return;

      setScore((prev) => prev + item.point);
      setLastPoint(item.point);

      setMessage(
        item.point >= 0
          ? `${item.emoji} 応援ありがとう！！`
          : `${item.emoji} えええーっ！？`
      );

      setCurrentItem(createRandomItem());
      setThrowing(false);

      messageTimer.current = window.setTimeout(() => {
        setLastPoint(null);
        setMessage("次の応援を待ってるよ♡");
      }, 1000);
    }, 550);
  };

  // フリック操作
  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (throwing || status !== "playing") return;

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (!pointerStart.current) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    pointerStart.current = null;

    // 上方向に40px以上動いたら投げる
    if (dy < -40 && Math.abs(dy) > Math.abs(dx)) {
      throwItem();
    }
  };

  useEffect(() => {
    return () => {
      if (throwTimer.current !== null) {
        window.clearTimeout(throwTimer.current);
      }
      if (messageTimer.current !== null) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  const rank = getRank(score);

  return (
    <main className="game">

      {/* 上部ヘッダー */}
      <header className="header">
        <div className="logo">♡ PUSH！YOUR IDOL ♡</div>
        <h1>推しに届け！</h1>
        <p>応援フリックゲーム</p>
      </header>

      {status !== "ended" ? (
        <>
          {/* スコア・時間 */}
          <section className="status-bar">
            <div className="status-card">
              <span>TIME</span>
              <strong className={timeLeft <= 10 ? "danger" : ""}>
                {timeLeft}
                <small>秒</small>
              </strong>
            </div>

            <div className="status-card">
              <span>SCORE</span>
              <strong>{score.toLocaleString()}</strong>
              <small>POINT</small>
            </div>
          </section>

          {/* 空・アイドル・ステージ */}
          <section className="sky-stage">

            <div className="cloud cloud-one">☁️</div>
            <div className="cloud cloud-two">☁️</div>
            <div className="cloud cloud-three">☁️</div>
            <div className="sun">☀️</div>

            <div className="stage-message">
              {message}
            </div>

            <div className={`idol ${throwing ? "idol-happy" : ""}`}>
              <div className="idol-sparkle">✨ ♡ ✨</div>
              <div className="idol-character">👩🏻‍🎤</div>
              <div className="idol-name">MY IDOL</div>
              <div className="idol-speech">
                {throwing ? "わーい！！" : "応援してね♡"}
              </div>
            </div>

            {/* 投げたアイテム */}
            {throwing && currentItem && (
              <div className="projectile">
                {currentItem.emoji}
              </div>
            )}

            {lastPoint !== null && (
              <div className="score-effect">
                {lastPoint > 0 ? "+" : ""}
                {lastPoint}点！
              </div>
            )}

            {/* 芝生ステージ */}
            <div className="grass">
              <div className="grass-pattern"></div>
              <div className="grass-label">
                ✨ IDOL STAGE ✨
              </div>
            </div>
          </section>

          {/* 次のアイテム表示 */}
          <section className="item-area">

            <div className="item-heading">
              <div>
                <h2>次に投げる応援アイテム</h2>
                <p>応援アイテムは自動でランダム出現！</p>
              </div>
              <div className="special-count">
                🦁 {3 - lionCount.current}/3
                <br />
                🌠 {1 - starCount.current}/1
              </div>
            </div>

            <div className="item-display">
              {status === "ready" ? (
                <div className="ready-card">
                  <div className="ready-icon">💙</div>
                  <h3>準備はいい？</h3>
                  <p>60秒間、推しを応援しよう！</p>
                </div>
              ) : (
                <button
                  className={`item-card ${throwing ? "item-throwing" : ""}`}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                  }}
                  disabled={throwing}
                >
                  <span className="item-caption">
                    今回の応援アイテム
                  </span>

                  <span className="item-emoji">
                    {throwing ? "💨" : currentItem?.emoji}
                  </span>

                  <strong className="item-name">
                    {throwing ? "投げています！" : currentItem?.name}
                  </strong>

                  <strong className={`item-point ${
                    (currentItem?.point ?? 0) < 0 ? "negative" : ""
                  }`}>
                    {throwing ? "届けー！" :
                      `${(currentItem?.point ?? 0) > 0 ? "+" : ""}${currentItem?.point} 点`}
                  </strong>

                  <span className="flick-hint">
                    {throwing ? "♡" : "↑ 上にフリック！"}
                  </span>
                </button>
              )}
            </div>

            {status === "ready" && (
              <button className="start-button" onClick={startGame}>
                GAME START！
              </button>
            )}

            {status === "playing" && (
              <p className="instruction">
                カードを上方向にフリックしてアイドルに届けよう！
              </p>
            )}

          </section>

          {/* アイテム一覧 */}
          <section className="item-list">
            <h3>♡ 応援アイテム一覧 ♡</h3>
            <div className="item-grid">
              {ITEM_TYPES.map((item) => (
                <div className="item-list-card" key={item.name}>
                  <span>{item.emoji}</span>
                  <small>{item.name}</small>
                  <strong className={item.point < 0 ? "negative" : ""}>
                    {item.point > 0 ? "+" : ""}
                    {item.point}点
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        /* 結果画面 */
        <section className="result-screen">
          <div className="result-confetti">🎉 ✨ 🎊</div>
          <h2>GAME OVER！</h2>
          <p className="result-lead">あなたのファンランクは...</p>

          <div className="result-rank">
            <div className="rank-icon">{rank.emoji}</div>
            <h3>{rank.name}</h3>
            <div className="result-score">
              {score.toLocaleString()}
              <small> 点</small>
            </div>
          </div>

          <div className="result-comment">
            <div className="result-idol">👩🏻‍🎤</div>
            <p>アイドルからのコメント</p>
            <h3>「{rank.comment}」</h3>
          </div>

          <button className="start-button" onClick={startGame}>
            もう一度遊ぶ ♡
          </button>
        </section>
      )}

      <footer className="footer">
        ♡ あなたの応援がアイドルの力になる ♡
      </footer>
    </main>
  );
}

export default App;
