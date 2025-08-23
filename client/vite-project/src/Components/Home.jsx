// src/Components/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";

export default function Home() {
  // ---- simple responsive hook ----
  const useScreen = () => {
    const [w, setW] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1280);
    React.useEffect(() => {
      const onResize = () => setW(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    const isMobile = w <= 480;
    const isTablet = w > 480 && w <= 1024;
    const isDesktop = w > 1024;
    return { w, isMobile, isTablet, isDesktop };
  };

  const { isMobile, isTablet } = useScreen();

  // Reviews grid columns (responsive)
  const reviewCols = isMobile ? 1 : isTablet ? 2 : 5;

  // Shared sizes
  const containerPad = isMobile ? 12 : 16;
  const heroHeight = isMobile ? 280 : isTablet ? 360 : 420;
  const heroTitleSize = isMobile ? 26 : isTablet ? 34 : 40;
  const heroSubSize = isMobile ? 14 : isTablet ? 16 : 18;

  const gridCols = isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
  const aboutGrid = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1.2fr 1fr";

  const styles = {
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: `0 ${containerPad}px`,
    },
    hero: {
      position: "relative",
      height: heroHeight,
      borderRadius: 12,
      overflow: "hidden",
      background:
        "url('https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqERXzr146IsKS4GQQ4JGMeLJ0mgoDHukDDj-APgJCV7yS-6YkpU5kGqqeXJON2Q1RaHiqL5wm58rrm61xo7dudc3SbYfpbVh6AXUg-773yATRyZeuJxymp8bm83xiK7rXfSI8Ear0dzli4=s1360-w1360-h1020-rw') center/cover no-repeat",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      textAlign: "center",
    },
    heroOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" },
    heroContent: { position: "relative", zIndex: 1, padding: "0 16px" },
    heroTitle: { fontSize: heroTitleSize, fontWeight: 800, margin: "6px 0" },
    heroSub: { fontSize: heroSubSize, opacity: 0.95, lineHeight: 1.4 },
    ctaRow: {
      marginTop: 16,
      display: "flex",
      gap: 12,
      justifyContent: "center",
      flexWrap: "wrap",
    },
    ctaBtnPrimary: {
      background: "#e11d48",
      color: "white",
      padding: isMobile ? "10px 14px" : "10px 16px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },
    ctaBtn: {
      background: "white",
      color: "#111",
      padding: isMobile ? "10px 14px" : "10px 16px",
      borderRadius: 8,
      border: "1px solid #ddd",
      cursor: "pointer",
      fontWeight: 600,
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: gridCols,
      gap: 16,
    },
    card: {
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 16,
      background: "white",
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    },
    section: { padding: isMobile ? "24px 0" : "32px 0" },
    sectionTitle: {
      fontSize: isMobile ? 20 : 24,
      fontWeight: 800,
      marginBottom: 10,
      textAlign: isMobile ? "center" : "left",
    },
    sectionSub: {
      color: "#555",
      marginBottom: 16,
      fontSize: isMobile ? 13 : 14,
      textAlign: isMobile ? "center" : "left",
    },
    aboutImg: {
      width: "100%",
      borderRadius: 12,
      height: isMobile ? 200 : 260,
      objectFit: "cover",
    },
    linkBtn: { color: "#e11d48", textDecoration: "none", fontWeight: 700 },
    footer: {
      marginTop: 32,
      padding: "18px 0",
      color: "#666",
      borderTop: "1px solid #eee",
      fontSize: 14,
      textAlign: "center",
    },
    badge: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: 999,
      background: "#fce7f3",
      color: "#9d174d",
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: 0.6,
    },
    whatsapp: {
      position: "fixed",
      right: 16,
      bottom: 16,
      height: 54,
      width: 54,
      borderRadius: "50%",
      background: "#25D366",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: 800,
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      cursor: "pointer",
      textDecoration: "none",
      transition: "transform 0.2s ease, boxShadow 0.2s ease",
    },
  };

  return (
    <div>
      {/* Hero */}
      <div style={styles.container}>
        <section style={styles.hero} role="img" aria-label="Showroom image">
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            <span style={styles.badge}>Grab your best DEAL...</span>
            <h1 style={styles.heroTitle}>Welcome to Shantha Motors</h1>
            <p style={styles.heroSub}>
              Your trusted two-wheeler partner in Bengaluru. Explore the latest bikes, EVs, service,
              offers and genuine spares.
            </p>
            <div style={styles.ctaRow}>
              <button
                style={styles.ctaBtnPrimary}
                onClick={() =>
                  document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Book a Test Ride
              </button>
              <button
                style={styles.ctaBtn}
                onClick={() =>
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Browse Products
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* We Do / Offer / Prefer */}
      <div style={styles.container}>
        <section style={styles.section} id="offerings">
          <h2 style={styles.sectionTitle}>We Do • We Offer • We Prefer In</h2>
          <p style={styles.sectionSub}>
            End-to-end dealership services focused on sales, service, safety and genuine spares.
          </p>
          <div style={styles.grid3}>
            <div style={styles.card}>
              <h3>SALES</h3>
              <p>
                Latest multi-branded bikes and scooters with city-wise on-road prices and flexible EMI
                options.
              </p>
            </div>
            <div style={styles.card}>
              <h3>SERVICE</h3>
              <p>Expert multi-point inspection, maintenance, and quick turnaround by technicians.</p>
            </div>
            <div style={styles.card}>
              <h3>SAFETY</h3>
              <p>Ride assured with genuine spares, helmets, and safety accessories approved.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Genuine Parts / Spares */}
      <div style={styles.container}>
        <section style={styles.section}>
          <div style={styles.card}>
            <h3>Genuine Parts • SPARES</h3>
            <p>
              We strictly use and recommend genuine parts to ensure performance, warranty
              compliance, and rider safety.
            </p>
          </div>
        </section>
      </div>

      {/* About */}
      <div style={styles.container}>
        <section
          style={{ ...styles.section, display: "grid", gridTemplateColumns: aboutGrid, gap: 18, alignItems: "center" }}
          id="about"
        >
          <div>
            <h2 style={styles.sectionTitle}>About Shantha Motors</h2>
            <p style={styles.sectionSub}>
              Founded in Aug 2022 by a visionary NITK Civil Engineer Nagesh, Shantha Motors began its
              journey with a single showroom in Bengaluru and a clear mission — to deliver exceptional
              two-wheeler sales, service, and customer experiences.
              <br /><br />
              From humble beginnings, we have grown rapidly: Year 1: 1 showroom → Year 2: 3 → Year 3:
              9 → Year 4: 10 (and counting). By the end of 2025, we aim for 15 showrooms, with a
              long-term vision of 100+ across Karnataka.
              <br /><br />
              Whether it’s your first bike, an upgrade, or reliable servicing, our promise is simple:
              you’re not just a customer — you’re family.
            </p>
            <Link to="/about" style={styles.linkBtn}>Read More →</Link>
          </div>
          <img
            style={styles.aboutImg}
            src="https://lh3.googleusercontent.com/gps-cs-s/AC9h4noMW7Ad5Pr7EhspftUPaMgaQPVTsLV5pZadjaSorV2-Jzq-KVEli15Kt22yg0QYUymh9lP4VGYbzLvoxZTPPIgybOfXySDzi9u9tCMGGpE5BK5qGJiz3Zh31slVi3n3KnwFin4=s1360-w1360-h1020-rw"
            alt="About Shantha Motors"
          />
        </section>
      </div>

      {/* Google Reviews */}
      <div style={styles.container}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Google Reviews</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${reviewCols}, 1fr)`,
              gap: 16,
            }}
          >
            {[
              { name: "Aarav Sharma", rating: 5, time: "2 days ago", text: "Smooth booking process and quick delivery. Staff was very helpful throughout." },
              { name: "Priya Nair", rating: 4.5, time: "1 week ago", text: "Good service quality, reasonable pricing. Will come back for servicing." },
              { name: "Rohit Verma", rating: 4, time: "3 weeks ago", text: "Test ride arranged instantly, paperwork was quick and hassle-free." },
              { name: "Ananya Iyer", rating: 5, time: "yesterday", text: "Transparent pricing and genuine accessories—very satisfied!" },
              { name: "Vikram Rao", rating: 4.5, time: "4 days ago", text: "Service center turnaround was quick and professional." },
              { name: "Sneha Kulkarni", rating: 4, time: "5 days ago", text: "Friendly staff, but the waiting area could be improved." },
              { name: "Arjun Menon", rating: 5, time: "2 weeks ago", text: "Great experience from booking to delivery. Highly recommended." },
              { name: "Meera Joshi", rating: 4.5, time: "6 days ago", text: "Prompt service and knowledgeable staff. Appreciate the quick updates." },
              { name: "Siddharth Desai", rating: 4, time: "1 month ago", text: "Good range of bikes and fair EMI options. Satisfied overall." },
              { name: "Kavya Reddy", rating: 5, time: "3 days ago", text: "Excellent after-sales service and polite staff." },
            ].map((review, i) => {
              const fullStars = Math.floor(review.rating);
              const hasHalf = review.rating % 1 !== 0;
              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    textAlign: "left",
                  }}
                >
                  {/* Header: emoji avatar + name + time */}
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        marginRight: 10,
                      }}
                    >
                      👤
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{review.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{review.time}</div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div style={{ color: "#FFD700", fontSize: 16, marginBottom: 6 }}>
                    {"★".repeat(fullStars)}
                    {hasHalf && "½"}
                    {"☆".repeat(5 - fullStars - (hasHalf ? 1 : 0))}
                    <span style={{ marginLeft: 6, color: "#555", fontSize: 12 }}>
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Title + text */}
                  <div style={{ fontWeight: 700, color: "#222", fontSize: 13, marginBottom: 4 }}>
                    {review.rating >= 4.5 ? "Excellent" : "Good"}
                  </div>
                  <div style={{ fontSize: 13, color: "#444" }}>
                    {review.text}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={styles.container}>
        <footer style={styles.footer}>
          <div>© {new Date().getFullYear()} Shantha Motors. All rights reserved.</div>
        </footer>
      </div>

      {/* WhatsApp Floating Button */}
      <a
        style={styles.whatsapp}
        href="https://wa.me/+919731366921"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>
    </div>
  );
}
