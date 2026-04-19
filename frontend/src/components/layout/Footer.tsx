import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative z-10 w-full py-6 mt-8 border-t border-white/10 text-center bg-transparent shrink-0">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex items-center justify-center space-x-4 text-xs font-medium tracking-wide text-muted-foreground opacity-70">
          <Link to="/privacy" className="hover:text-primary hover:underline transition-all duration-200">
            Privacy Policy
          </Link>
          <span className="opacity-50">|</span>
          <Link to="/terms" className="hover:text-primary hover:underline transition-all duration-200">
            Terms
          </Link>
          <span className="opacity-50">|</span>
          <a 
            href="https://github.com/VaibhaVSharmaVvs/Beatify" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-primary hover:underline transition-all duration-200"
          >
            Contact
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground/40 max-w-[300px] leading-relaxed">
          This app uses the Spotify API but is not endorsed or certified by Spotify.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
