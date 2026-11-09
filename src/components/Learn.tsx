export default function Learn() {
  return <div className="learn-grid">
    <section className="panel lesson"><span className="method-tag">METHOD 01</span><h2>Luhn · modulo 10</h2><p>The final digit balances a weighted sum to a multiple of 10. Work from the right of the payload, doubling every other digit. Subtract 9 from doubled values greater than 9.</p><div className="math-example"><span>Payload</span><strong>7 9 9 2 7 3 9 8 7 1</strong><span>Weighted sum</span><strong>67</strong><span>Check digit</span><strong>(10 − 67 mod 10) mod 10 = <em>3</em></strong></div><p className="lesson-note">Complete example: <code>79927398713</code>. A valid checksum does not establish that a number was issued.</p></section>
    <section className="panel lesson"><span className="method-tag">METHOD 02</span><h2>Instructional mod-11</h2><p>Multiply the payload digits by weights 2, 3, 4, 5, 6, 7, cycling from right to left. Subtract the sum’s remainder from 11, then take modulo 11. Encode a result of 10 as X.</p><div className="math-example"><span>Payload × weights</span><strong>1×4 + 2×3 + 3×2</strong><span>Weighted sum</span><strong>16</strong><span>Check digit</span><strong>(11 − 16 mod 11) mod 11 = <em>6</em></strong></div><p className="lesson-note">Complete examples: <code>1236</code> and <code>6X</code>. This is a demo supplier-code scheme, not an official TIN or SSS rule.</p></section>
    <section className="panel lesson wide"><div className="eyebrow">THE AUDITOR’S PERSPECTIVE</div><h2>A flag starts a review.</h2><div className="learning-columns"><div><h3>Catch entry errors</h3><p>A checksum mismatch means the entered code does not satisfy its arithmetic rule. The cause could be a typo, a wrong check digit, or something else.</p></div><div><h3>Investigate possible swaps</h3><p>We try each adjacent pair of different digits. If a swap passes, it becomes a possible transposition. Several swaps can pass; none proves the original value.</p></div><div><h3>Understand the limits</h3><p>Luhn misses some errors, including adjacent 09 ↔ 90 swaps. Deliberately constructed numbers can pass. This tool does not detect duplicate payments or establish fraud.</p></div></div></section>
    <section className="panel lesson wide">
      <div className="eyebrow">PROJECT CREATORS · 1BSA-ABM2 GROUP 3</div>
      <h2>The team behind Checkwise</h2>
      <p className="lesson-note">Created for Mathematics in the Modern World (MMW) by 1BSA-ABM2 Group 3.</p>
      <div className="team-grid">
        <div className="team-card leader">
          <span className="team-badge">Leader</span>
          <h3>Jim Michael Ellaga</h3>
          <p className="team-subtitle">1BSA-ABM2</p>
        </div>
        <div className="team-card">
          <span className="team-badge">Member</span>
          <h3>Earl Andrey Ebora</h3>
          <p className="team-subtitle">1BSA-ABM2</p>
        </div>
        <div className="team-card">
          <span className="team-badge">Member</span>
          <h3>John Ezequel Matarondo</h3>
          <p className="team-subtitle">1BSA-ABM2</p>
        </div>
        <div className="team-card">
          <span className="team-badge">Member</span>
          <h3>Ayeza Lorah Revilloza</h3>
          <p className="team-subtitle">1BSA-ABM2</p>
        </div>
        <div className="team-card">
          <span className="team-badge">Member</span>
          <h3>Georgea Lhouwilla Bascos</h3>
          <p className="team-subtitle">1BSA-ABM2</p>
        </div>
      </div>
    </section>
  </div>;
}
