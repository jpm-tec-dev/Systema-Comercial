import React from 'react';

export default function Section({ id, activeSection, title, description, children }) {
  return (
    <section className={`section ${activeSection === id ? 'active' : ''}`} id={`sec-${id}`}>
      <div className="section-head">
        <div className="section-title">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="pill">v4.3 React</span>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
