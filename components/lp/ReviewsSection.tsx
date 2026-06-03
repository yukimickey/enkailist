export function ReviewsSection() {
  const reviews = [
    {
      name: "田中さん",
      role: "IT企業 総務部",
      text: "忘年会で使いました。ビンゴの代わりにクイズをやったら、参加者の反応が全然違って大盛り上がりでした！",
    },
    {
      name: "佐藤さん",
      role: "結婚式二次会 幹事",
      text: "新郎新婦に関するクイズで使わせてもらいました。QRコードを見せるだけで全員参加できて、準備も楽でした。",
    },
    {
      name: "鈴木さん",
      role: "飲食店 オーナー",
      text: "定期的にお客様向けのクイズイベントを開催しています。リピーターが増えて、お店の集客にも役立っています。",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black mb-4">利用者の声</h2>
          <p className="text-muted text-lg">
            さまざまなシーンでご利用いただいています
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-muted-bg rounded-2xl p-6 relative"
            >
              <div className="text-4xl text-primary/20 font-serif absolute top-3 left-4">
                &ldquo;
              </div>
              <p className="text-foreground leading-relaxed mb-4 pt-4">
                {review.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {review.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{review.name}</p>
                  <p className="text-xs text-muted">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
