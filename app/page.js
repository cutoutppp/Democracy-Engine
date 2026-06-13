import Link from 'next/link';

export default function Home() {
  return (
    <main className="home-container animate-fade-in">
      <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
        Democracy Engine
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem' }}>
        ระบบสร้างและเล่นเกมการเมืองไทยสไตล์ Reigns
      </p>

      <div className="grid-2">
        <Link href="/editor" className="card-option glass">
          <div className="icon-large">🛠️</div>
          <h2>สร้างการ์ด (Card Editor)</h2>
          <p style={{ color: 'var(--text-muted)' }}>สำหรับนักเรียนออกแบบการ์ดและสร้างเกมของกลุ่มตัวเอง</p>
        </Link>

        <Link href="/play" className="card-option glass" style={{ borderColor: 'var(--primary)' }}>
          <div className="icon-large">🎮</div>
          <h2>เล่นเกม (Play Game)</h2>
          <p style={{ color: 'var(--text-muted)' }}>สวมบทบาทนายกรัฐมนตรี บริหารประเทศฝ่าวิกฤต 20 เทิร์น</p>
        </Link>
      </div>
    </main>
  );
}
