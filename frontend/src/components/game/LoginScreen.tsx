
import { Button } from "@/components/ui/button";
import Rulebook from "./Rulebook";

interface LoginScreenProps {
  onConnect: () => void;
}

const LoginScreen = ({ onConnect }: LoginScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8 slide-up">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
            <img src="/favicon.svg" alt="Beatify Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight glow-text">
            Beatify | Guess The Song
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto">
            Test your music knowledge with your own Spotify playlists.
          </p>
        </div>

        <Button
          variant="spotify"
          size="xl"
          onClick={onConnect}
          className="w-full pulse-glow"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect with Spotify
        </Button>

        <p className="text-muted-foreground text-sm">
          Premium required for full playback.
        </p>
      </div>
      
      {/* Rulebook Hover Widget */}
      <div className="fixed bottom-6 left-6 z-40">
        <Rulebook />
      </div>
    </div>
  );
};

export default LoginScreen;
