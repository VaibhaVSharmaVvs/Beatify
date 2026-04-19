import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
            <h1 className="text-4xl font-bold tracking-tight mb-2 glow-text">Terms of Service</h1>
            <p className="text-muted-foreground text-sm">Last updated: April 19, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and playing Beatify, you accept and agree to be bound by the terms and provisions of this agreement. Beatify is provided strictly "as-is" and without any warranty of any kind.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Not Affiliated with Spotify</h2>
            <p className="text-muted-foreground leading-relaxed">
              Beatify is an independent third-party application. <strong>We are in no way affiliated, endorsed, certified, or sponsored by Spotify AB.</strong> We utilize the public Spotify Web API strictly within their developer guidelines to provide the trivia experience.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for ensuring their use of Spotify complies with Spotify’s Terms of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We provide this application dynamically and offer <strong>no explicit guarantee of uptime or availability.</strong> The service relies identically on the structural health of the Spotify Web API and Web Playback SDK. We reserve the right to suspend or terminate the service at any time without notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall the developers, contributors, or operators of Beatify be liable for any direct, indirect, incidental, or consequential damages arising out of the use or inability to use the application or its connected services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
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

export default TermsOfService;
