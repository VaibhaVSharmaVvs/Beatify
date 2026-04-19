import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <div className="space-y-8 pb-20 fade-in">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 glow-text">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: April 19, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Data Collected</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you authenticate with Beatify using your Spotify account via OAuth, we collect and temporarily process specific profile information to generate your gameplay experience. The exact data read from your account includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Your Spotify User ID</li>
              <li>Your Display Name</li>
              <li>Your Profile Image URL</li>
              <li>Your Playlists (and the tracks contained within)</li>
              <li>Gameplay statistics (generated during game sessions)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We may also access your Spotify account email, playback state, and connected device information as required for authentication and playback functionality via the Spotify Web API and Web Playback SDK.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Purpose & Usage</h2>
            <p className="text-muted-foreground leading-relaxed">
              We exclusively use this data for the core functions of the application:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong>Gameplay Generation:</strong> Turning your playlists into trivia rounds.</li>
              <li><strong>Analytics / Stats:</strong> Displaying your historical match data, reflex times, and streaks on your personal dashboard.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We operate under a strict read-only policy concerning your core Spotify account. <strong>We do not modify, delete, or alter any of your Spotify data or playlists.</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Data Storage & Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your Spotify ID and gameplay history (which tracks were guessed correctly/incorrectly and corresponding timestamps) are securely stored in our managed database (Supabase) exclusively to enable historical leaderboards and stat aggregation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You may request deletion of your stored data by contacting us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Data Sharing & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, rent, or share your personal data. The application requests only the minimum OAuth scopes necessary to facilitate the Web Playback SDK and fetch playlist metadata.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns regarding this policy, or to request data deletion, please contact us at:
              <br />
              For support, contact: <strong>vaibhavsharmavvs@gmail.com</strong>
              <br />
              <a 
                href="https://github.com/VaibhaVSharmaVvs/Beatify" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium mt-2 inline-block"
              >
                GitHub Repository
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
