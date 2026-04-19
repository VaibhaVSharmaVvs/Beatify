import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative z-10 w-full py-6 mt-8 border-t border-white/10 text-center bg-transparent shrink-0">
      <div className="flex items-center justify-center space-x-4 text-xs font-medium tracking-wide text-muted-foreground opacity-70">
        <Link to="/privacy" className="hover:text-primary hover:underline transition-all duration-200">
          Privacy Policy
        </Link>
        <span className="opacity-50">|</span>
        <Link to="/terms" className="hover:text-primary hover:underline transition-all duration-200">
          Terms of Service
        </Link>
        <span className="opacity-50">|</span>
        <a 
          href="https://github.com/VaibhaVSharmaVvs/Beatify" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-primary hover:underline transition-all duration-200"
        >
          Contact / GitHub
        </a>
      </div>
    </footer>
  );
};

export default Footer;
