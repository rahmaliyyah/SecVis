import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f4f6fb',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f2f8; }
        ::-webkit-scrollbar-thumb { background: #c8d0e0; border-radius: 3px; }
      `}</style>
      <Sidebar />
      <main style={{
        flex: 1,
        padding: '28px 32px',
        overflowY: 'auto',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  )
}