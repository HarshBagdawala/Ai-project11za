'use client'

import React from 'react'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ textAlign: 'center', color: 'white', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>🔍 Visual Search Bot</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
          AI-powered product discovery on WhatsApp
        </p>

        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '30px', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          marginBottom: '30px'
        }}>
          <h2 style={{ marginTop: 0 }}>How it works:</h2>
          <ol style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>📸 Send a product photo on WhatsApp</li>
            <li>🤖 AI analyzes your image instantly</li>
            <li>🔎 Finds top 3 similar products</li>
            <li>💳 Get Razorpay payment links</li>
            <li>😊 All in natural Hinglish!</li>
          </ol>
        </div>

        <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
          <p>✅ Status: <strong>Active</strong></p>
          <p>🚀 Tech: Next.js 14 | Groq AI | Mistral Embeddings | Supabase pgVector</p>
        </div>
      </div>
    </div>
  )
}
