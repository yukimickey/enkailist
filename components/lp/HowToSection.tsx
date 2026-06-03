export function HowToSection() {
  const steps = [
    {
      step: "01",
      title: "クイズを作成",
      description: "4択クイズをブラウザ上で作成。問題数は自由に設定できます。",
      color: "bg-red-500",
    },
    {
      step: "02",
      title: "QRコードを共有",
      description: "生成されたQRコードをプロジェクターに表示。参加者はスマホで読み取るだけ。",
      color: "bg-blue-500",
    },
    {
      step: "03",
      title: "みんなで回答",
      description: "制限時間内にタップで回答。速く正解するほど高得点！",
      color: "bg-yellow-500",
    },
    {
      step: "04",
      title: "ランキング発表",
      description: "リアルタイムでスコアが集計され、最終ランキングを発表。",
      color: "bg-green-500",
    },
  ];

  return (
    <section className="py-20 bg-muted-bg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">使い方はかんたん4ステップ</h2>
          <p className="text-muted text-lg">準備から本番まで、スムーズに進められます</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              <div
                className={`${item.color} text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mb-4`}
              >
                {item.step}
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-muted text-sm leading-relaxed">
                {item.description}
              </p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full">
                  <div className="border-t-2 border-dashed border-border w-[calc(100%-3rem)] mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
