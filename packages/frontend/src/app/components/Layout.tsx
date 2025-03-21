import React from 'react';
import { Link } from '@tanstack/react-router';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <h1>Stitch Fix Client Engagement</h1>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
            System
          </Link>
          <Link to="/dashboard" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
            Dashboard
          </Link>
          <Link to="/users" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
            Users
          </Link>
          <Link to="/emails" className={styles.navLink} activeProps={{ className: styles.activeNavLink }}>
            Emails
          </Link>
        </nav>
      </header>
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <p>Stitch Fix Client Engagement Acceleration System &copy; 2025</p>
      </footer>
    </div>
  );
};

export default Layout;