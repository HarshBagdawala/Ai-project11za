'use client'

import React, { useEffect, useState } from 'react'
import type { Product, SearchLog } from '@/types'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<SearchLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'logs'>('products')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Since we can't directly call Supabase from client, this would typically
      // call an API route or use Supabase's public API
      // For now, this is a placeholder structure
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>📊 Admin Dashboard</h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'products' ? '#667eea' : '#ddd',
              color: activeTab === 'products' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            📦 Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'logs' ? '#667eea' : '#ddd',
              color: activeTab === 'logs' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            📋 Search Logs ({logs.length})
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {activeTab === 'products' && (
          <div>
            <h2>Products in Catalog</h2>
            {products.length === 0 ? (
              <p style={{ color: '#666' }}>No products yet. Run: npm run ingest</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px', marginBottom: '10px' }} />
                    <h3 style={{ margin: '5px 0', fontSize: '0.95em' }}>{p.name}</h3>
                    <p style={{ margin: '5px 0', color: '#667eea', fontWeight: 'bold' }}>₹{p.price}</p>
                    <p style={{ margin: '5px 0', fontSize: '0.85em', color: '#666' }}>{p.color} • {p.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <h2>Recent Searches</h2>
            {logs.length === 0 ? (
              <p style={{ color: '#666' }}>No searches yet. Customers send images on WhatsApp to start!</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#667eea', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Detected Tags</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Products Found</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{log.customer_phone}</td>
                      <td style={{ padding: '12px', fontSize: '0.85em' }}>{log.detected_tags?.color} {log.detected_tags?.type}</td>
                      <td style={{ padding: '12px' }}>{log.matched_product_ids?.length || 0}</td>
                      <td style={{ padding: '12px', fontSize: '0.85em', color: '#666' }}>Recent</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
