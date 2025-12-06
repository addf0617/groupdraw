import { useRef, useState } from 'react'
import './App.css'

type Pool = { id: string; name: string; items: string[] }
type GroupItem = { label: string; poolName: string }

function App() {
  const [pools, setPools] = useState<Pool[]>([])
  const [newPoolName, setNewPoolName] = useState('')
  const [addText, setAddText] = useState<Record<string, string>>({})
  const [groupCountInput, setGroupCountInput] = useState('2')
  const [results, setResults] = useState<GroupItem[][]>([])
  const idSeq = useRef(0)

  const groupCount = Math.max(1, Number.parseInt(groupCountInput || '0') || 0)

  const totalItems = pools.reduce((acc, p) => acc + p.items.length, 0)
  const canDraw = groupCount > 0 && totalItems > 0

  function addPool() {
    const name = sanitizeInput(newPoolName)
    if (!name) return
    idSeq.current += 1
    const id = `pool-${idSeq.current}`
    setPools([...pools, { id, name, items: [] }])
    setNewPoolName('')
  }

  function removePool(id: string) {
    setPools(pools.filter(p => p.id !== id))
    const next = { ...addText }
    delete next[id]
    setAddText(next)
  }

  function setPoolInput(id: string, val: string) {
    setAddText({ ...addText, [id]: val })
  }

  function addItem(poolId: string) {
    const text = sanitizeInput(addText[poolId] || '')
    if (!text) return
    setPools(pools.map(p => (p.id === poolId ? { ...p, items: [...p.items, text] } : p)))
    setAddText({ ...addText, [poolId]: '' })
  }

  function removeItem(poolId: string, idx: number) {
    setPools(pools.map(p => (p.id === poolId ? { ...p, items: p.items.filter((_, i) => i !== idx) } : p)))
  }

  function sanitizeInput(s: string) {
    const normalized = s.normalize('NFKC')
    const filtered = Array.from(normalized)
      .filter((ch) => {
        const code = ch.charCodeAt(0)
        return !(code <= 31 || (code >= 127 && code <= 159))
      })
      .join('')
    const collapsed = filtered.replace(/\s+/g, ' ').trim()
    const stripped = collapsed.replace(/[<>"'`]/g, '')
    return stripped.slice(0, 100)
  }

  function shuffle<T>(arr: T[]) {
    const a = arr.slice()
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const t = a[i]
      a[i] = a[j]
      a[j] = t
    }
    return a
  }

  function draw() {
    if (!canDraw) return
    const groups: GroupItem[][] = Array.from({ length: groupCount }, () => [])
    for (const pool of pools) {
      if (pool.items.length === 0) continue
      const items = shuffle(pool.items)
      const start = Math.floor(Math.random() * groupCount)
      for (let i = 0; i < items.length; i++) {
        const g = (start + i) % groupCount
        groups[g].push({ label: items[i], poolName: pool.name })
      }
    }
    setResults(groups)
  }

  return (
    <div style={{display: 'flex', justifyContent: 'center', width: '100%'}}>
    <div className="app">
      <section className="section">
        <h2>分組池</h2>
        <div className="add-row">
          <input
            placeholder="分組池名稱"
            value={newPoolName}
            onChange={e => setNewPoolName(e.target.value)}
            maxLength={100}
          />
          <button onClick={addPool}>新增分組池</button>
        </div>

        <div className="pools">
          {pools.length === 0 && <div className="empty">尚未建立分組池</div>}
          {pools.map(pool => (
            <div key={pool.id} className="pool-card">
              <div className="pool-header">
                <div className="pool-name">{pool.name}</div>
                <button className="danger" onClick={() => removePool(pool.id)}>刪除池</button>
              </div>
              <div className="pool-add">
                <input
                  placeholder="新增籤"
                  value={addText[pool.id] || ''}
                  onChange={e => setPoolInput(pool.id, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addItem(pool.id)
                  }}
                  maxLength={100}
                />
                <button onClick={() => addItem(pool.id)}>加入</button>
              </div>
              <ul className="pool-items">
                {pool.items.map((it, idx) => (
                  <li key={idx} className="pool-item">
                    <span>{it}</span>
                    <button className="ghost" onClick={() => removeItem(pool.id, idx)}>移除</button>
                  </li>
                ))}
                {pool.items.length === 0 && <li className="muted">沒有籤</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>設定與抽籤</h2>
        <div className="controls">
          <label>
            要分成幾組：
            <input
              type="number"
              min={1}
              value={groupCountInput}
              onChange={e => setGroupCountInput(e.target.value)}
            />
          </label>
          <div className="summary">
            已加入籤數：{totalItems}
          </div>
          <button onClick={draw} disabled={!canDraw}>抽籤</button>
        </div>
      </section>
    </div>
    <section className="section">
        <h2>結果</h2>
        {results.length === 0 ? (
          <div className="empty">尚未抽籤</div>
        ) : (
          <div className="groups-grid">
            {results.map((group, idx) => (
              <div key={idx} className="group-card">
                <div className="group-title">第 {idx + 1} 組</div>
                <ul className="group-items">
                  {group.map((gi, i) => (
                    <li key={i}>
                      <span className="tag">{gi.poolName}</span>
                      <span>{gi.label}</span>
                    </li>
                  ))}
                  {group.length === 0 && <li className="muted">此組沒有籤</li>}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
  )
}

export default App
