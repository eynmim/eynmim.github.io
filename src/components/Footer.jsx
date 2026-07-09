import { LogoA } from './Nav';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <a className="footer-brand" href="#home"><LogoA size={22} /><b>Ali Mansouri</b></a>
        <div className="footer-links">
          <a href="https://github.com/eynmim" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/ali-mansouri-767b65235/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="mailto:Mansouriali955@gmail.com">Email</a>
        </div>
        <div className="footer-meta">Embedded Systems Engineer · Turin · © 2026</div>
      </div>
    </footer>
  );
}
