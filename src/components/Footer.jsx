import { useLang } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="portfolio-footer">
      <p>
        {t('footer.designed')} | {new Date().getFullYear()}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="https://github.com/eynmim" target="_blank" rel="noopener noreferrer">GitHub</a>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </p>
    </footer>
  );
}
