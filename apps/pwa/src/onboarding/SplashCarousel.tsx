import { useMemo, useState } from "react";
import ConsentChecklist from "./ConsentChecklist";
import { slides } from "./slides";

type SplashCarouselProps = {
  onFinish: () => void;
};

export default function SplashCarousel({ onFinish }: SplashCarouselProps) {
  const [index, setIndex] = useState(0);
  const [consent, setConsent] = useState({
    privacy: false,
    foreground: false,
    permissions: false,
    speechOptIn: false
  });

  const atEnd = index === slides.length;
  const canAdvance = useMemo(() => {
    if (!atEnd) return true;
    return (
      consent.privacy &&
      consent.foreground &&
      consent.permissions &&
      consent.speechOptIn
    );
  }, [atEnd, consent]);

  const goNext = () => {
    if (atEnd) {
      if (canAdvance) onFinish();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, slides.length));
  };

  const goBack = () => setIndex((prev) => Math.max(prev - 1, 0));

  return (
    <div className="onboarding-shell">
      <div className="onboarding-header">
        <div className="logo">Sehx</div>
        <div className="chip">Private PWA</div>
      </div>

      <div className="onboarding-body">
        {!atEnd ? (
          <div className="slide-card">
            <div className="slide-eyebrow">{slides[index].eyebrow}</div>
            <h1>{slides[index].title}</h1>
            <p>{slides[index].body}</p>
          </div>
        ) : (
          <div className="slide-card">
            <div className="slide-eyebrow">Consent</div>
            <h1>Confirm before first use</h1>
            <p>
              You are in control. Review these constraints and acknowledgements
              before starting a session.
            </p>
            <ConsentChecklist value={consent} onChange={setConsent} />
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        <div className="dots">
          {Array.from({ length: slides.length + 1 }).map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <div className="actions">
          <button className="ghost" onClick={goBack} disabled={index === 0}>
            Back
          </button>
          <button className="primary" onClick={goNext} disabled={!canAdvance}>
            {atEnd ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
