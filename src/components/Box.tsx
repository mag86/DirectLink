import React from 'react';

export const Box: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ maxWidth: 480, margin: '0 auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
    {children}
  </div>
);

