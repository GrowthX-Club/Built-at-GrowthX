import BuiltLogo from "./BuiltLogo";

type SarvamPhoto = {
  src: string;
  alt: string;
};

const SARVAM_PHOTOS: readonly SarvamPhoto[] = [
  {
    src: "/sarvam/original-selfie.jpg",
    alt: "A wide group selfie from the Sarvam Epoch Buildathon floor",
  },
  {
    src: "/sarvam/original-sign.jpg",
    alt: "Sarvam Epoch Buildathon event sign presented by GrowthX",
  },
  {
    src: "/sarvam/winners-group.jpg",
    alt: "The Sarvam Epoch Buildathon finalists and organisers together on stage",
  },
  {
    src: "/sarvam/crowd-celebration.jpg",
    alt: "Builders crowding together for a celebratory photo",
  },
  {
    src: "/sarvam/host-stage.jpg",
    alt: "A host addressing builders on the Sarvam Epoch Buildathon floor",
  },
  {
    src: "/sarvam/raised-hands.jpg",
    alt: "Builders raising their hands during the Sarvam Epoch Buildathon",
  },
  {
    src: "/sarvam/builders-listening.jpg",
    alt: "Builders listening closely during a Sarvam Epoch Buildathon session",
  },
  {
    src: "/sarvam/epoch-tote.jpg",
    alt: "The Sarvam Epoch tote bag displayed on a red chair",
  },
  {
    src: "/sarvam/sarvam-team.jpg",
    alt: "Sarvam team members speaking with builders on the event floor",
  },
  {
    src: "/sarvam/panel-red-couch.jpg",
    alt: "Buildathon speakers and mentors sharing a light moment on the red couch",
  },
  {
    src: "/sarvam/roundtable-yellow-wall.jpg",
    alt: "Builders and mentors in conversation beside the yellow and blue event mural",
  },
  {
    src: "/sarvam/epoch-tote-closeup.jpg",
    alt: "A builder carrying the illustrated Sarvam Epoch tote bag",
  },
  {
    src: "/sarvam/builders-portrait.jpg",
    alt: "Two builders smiling together on the Sarvam Epoch Buildathon floor",
  },
  {
    src: "/sarvam/audience-reaction.jpg",
    alt: "Builders watching a live session together during the Sarvam Epoch Buildathon",
  },
  {
    src: "/sarvam/speaker-stage.jpg",
    alt: "A speaker addressing builders on the Sarvam Epoch Buildathon stage",
  },
] as const;

const SARVAM_PHOTO_ROWS = [
  { aspectRatio: "1.5 / 1", tiles: [{ photo: 2, columns: 12 }] },
  { aspectRatio: "1.6 / 1", tiles: [{ photo: 9, columns: 12 }] },
  { aspectRatio: "1.7 / 1", tiles: [{ photo: 13, columns: 12 }] },
  { aspectRatio: "1.7 / 1", tiles: [{ photo: 5, columns: 12 }] },
  { aspectRatio: "2.1 / 1", tiles: [{ photo: 10, columns: 7 }, { photo: 11, columns: 5 }] },
  { aspectRatio: "2.1 / 1", tiles: [{ photo: 12, columns: 5 }, { photo: 3, columns: 7 }] },
  { aspectRatio: "2.6 / 1", tiles: [{ photo: 0, columns: 6 }, { photo: 8, columns: 6 }] },
  { aspectRatio: "1.7 / 1", tiles: [{ photo: 4, columns: 12 }] },
  { aspectRatio: "2.1 / 1", tiles: [{ photo: 1, columns: 4 }, { photo: 14, columns: 8 }] },
  { aspectRatio: "2.4 / 1", tiles: [{ photo: 6, columns: 6 }, { photo: 7, columns: 6 }] },
] as const;

const COMPANIES = [
  "Apple",
  "Meta",
  "Google",
  "NVIDIA",
  "Databricks",
  "Cloudflare",
  "Microsoft AI",
  "LinkedIn",
  "Uber",
  "Airbnb",
  "Coinbase",
  "Razorpay",
  "Zepto",
  "Swiggy",
  "Zomato",
  "Blinkit",
  "Meesho",
  "Flipkart",
  "PhonePe",
  "BrowserStack",
  "Freshworks",
] as const;

function SarvamPhotoMosaicSet({ duplicate }: { duplicate: boolean }) {
  return (
    <div className="sarvam-photo-mosaic-set" aria-hidden={duplicate}>
      {SARVAM_PHOTO_ROWS.map((row, rowIndex) => (
        <div
          className="sarvam-photo-row"
          key={rowIndex}
          style={{ aspectRatio: row.aspectRatio }}
        >
          {row.tiles.map(({ photo: photoIndex, columns }) => {
            const photo = SARVAM_PHOTOS[photoIndex];

            return (
              <div
                className="sarvam-photo-tile"
                key={`${rowIndex}-${photoIndex}`}
                style={{ gridColumn: `span ${columns}` }}
              >
                <img
                  src={photo.src}
                  alt={duplicate ? "" : photo.alt}
                  draggable={false}
                  loading={duplicate ? "lazy" : "eager"}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
export default function SarvamBuildathonHero() {
  return (
    <section className="sarvam-hero" aria-labelledby="sarvam-hero-title">
      <div className="sarvam-hero-grid">
        <div className="sarvam-hero-copy">
          <div className="sarvam-hero-brandline">
            <a className="sarvam-built-logo" href="/" aria-label="Built at GrowthX home">
              <BuiltLogo height={44} />
            </a>
            <div className="sarvam-hero-kicker">
              <span className="sarvam-live-dot" aria-hidden="true" />
              Sarvam Epoch Buildathon by GrowthX
            </div>
          </div>

          <h1 id="sarvam-hero-title">
            The buildathon<br />
            that broke<br />
            <em>the internet.</em>
          </h1>

          <p className="sarvam-hero-description">
            Engineers from Apple, Meta, Google, NVIDIA, Databricks, Cloudflare, Microsoft AI and India&apos;s best technology companies came to build.
          </p>

          <div className="sarvam-hero-actions">
            <a className="sarvam-primary-cta" href="#sarvam-projects">
              Explore projects <span aria-hidden="true">↓</span>
            </a>
            <a
              className="sarvam-trend-cta"
              href="https://x.com/i/trending/2081268818761142325"
              target="_blank"
              rel="noreferrer"
            >
              See why it trended on X <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="sarvam-partners" aria-label="Event partners">
            <div className="sarvam-partner-group">
              <span>Powered by</span>
              <div className="sarvam-partner-brands">
                <strong>Bessemer</strong>
                <i aria-hidden="true">+</i>
                <strong>Lightspeed</strong>
              </div>
            </div>
            <div className="sarvam-partner-group">
              <span>Supported by</span>
              <div className="sarvam-partner-brands">
                <strong>Razorpay</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="sarvam-photo-wall" aria-label="Photos from the Sarvam Epoch Buildathon">
          <div className="sarvam-photo-drift">
            <SarvamPhotoMosaicSet duplicate={false} />
            <SarvamPhotoMosaicSet duplicate />
          </div>
        </div>
      </div>

      <div className="sarvam-company-rail" aria-label="Companies represented">
        <span className="sarvam-company-label">Engineers from</span>
        <div className="sarvam-company-list">
          {COMPANIES.map((company) => <span key={company}>{company}</span>)}
        </div>
      </div>
    </section>
  );
}
