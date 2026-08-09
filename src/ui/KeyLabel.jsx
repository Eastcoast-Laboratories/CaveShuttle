import React from 'react';
import './KeyLabel.css';

// Consistently styled key label used in the hamburger menu controls list and the tutorial.
export default function KeyLabel({ children }) {
  return <kbd className="key-label">{children}</kbd>;
}
