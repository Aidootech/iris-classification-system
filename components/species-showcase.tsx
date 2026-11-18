"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useState,
  type FocusEvent,
} from "react";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { SPECIES_COLORS, SPECIES_LABELS, SPECIES_ORDER } from "@/lib/format";
import { SPECIES_INFO } from "@/lib/species";

const SLIDES = SPECIES_ORDER.map((species, index) => ({
  species,
  index,
  label: SPECIES_LABELS[species],
  color: SPECIES_COLORS[species],
  ...SPECIES_INFO[species],
}));

const ROTATION_MS = 7000;

export function SpeciesShowcase() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (hovered || userPaused || reducedMotion) return;

    const timer = window.setTimeout(
      () => setActive((current) => (current + 1) % SLIDES.length),
      ROTATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [active, hovered, userPaused, reducedMotion]);

  function show(index: number) {
    setActive((index + SLIDES.length) % SLIDES.length);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setHovered(false);
    }
  }

  const slide = SLIDES[active];

  return (
    <div
      className="showcase"
      id="species"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={handleBlur}
      aria-roledescription="carousel"
      aria-label="Iris species"
    >
      <div className="showcase-stage">
        <div className="showcase-media">
          {SLIDES.map((item) => (
            <div
              key={item.species}
              className={`showcase-slide${
                item.index === active ? " is-active" : ""
              }`}
              aria-hidden={item.index === active ? undefined : true}
            >
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                unoptimized
                priority={item.index === 0}
                sizes="(max-width: 900px) 100vw, 640px"
              />
            </div>
          ))}

          <div className="showcase-media-top">
            <span className="showcase-badge">
              <span
                className="showcase-badge-dot"
                style={{ backgroundColor: slide.color }}
                aria-hidden="true"
              />
              {slide.label}
            </span>
            <span className="showcase-counter">
              0{active + 1} <span>/ 03</span>
            </span>
          </div>

          <span className="showcase-caption">
            {slide.common} · {slide.region}
          </span>
        </div>

        <div className="showcase-info">
          <p className="showcase-kicker">Species profile</p>
          <h3 className="showcase-title">{slide.display}</h3>
          <p className="showcase-common">{slide.common}</p>
          <p className="showcase-description">{slide.description}</p>

          <dl className="showcase-facts">
            <div>
              <dt>Sepal length</dt>
              <dd>{slide.sepalRange}</dd>
            </div>
            <div>
              <dt>Petal length</dt>
              <dd>{slide.petalRange}</dd>
            </div>
            <div>
              <dt>Bloom</dt>
              <dd>{slide.bloom}</dd>
            </div>
          </dl>

          <p className="showcase-note">{slide.note}</p>

          <div className="showcase-footer">
            <div className="showcase-dots" role="group" aria-label="Choose a species">
              {SLIDES.map((item) => (
                <button
                  key={item.species}
                  type="button"
                  aria-pressed={item.index === active}
                  aria-label={`Show ${item.display}`}
                  className="showcase-dot"
                  data-active={item.index === active ? "true" : undefined}
                  onClick={() => show(item.index)}
                >
                  <span />
                </button>
              ))}
            </div>

            <div className="showcase-controls">
              <button
                type="button"
                className="showcase-arrow"
                onClick={() => show(active - 1)}
                aria-label="Previous species"
              >
                <ArrowLeftIcon size={16} />
              </button>
              <button
                type="button"
                className="showcase-arrow"
                onClick={() => show(active + 1)}
                aria-label="Next species"
              >
                <ArrowRightIcon size={16} />
              </button>
              <button
                type="button"
                className="showcase-pause"
                onClick={() => setUserPaused((value) => !value)}
                aria-pressed={userPaused}
              >
                {userPaused ? "Play" : "Pause"}
              </button>
            </div>
          </div>

          <Link href="/models" className="showcase-link">
            See how the model separates them
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </div>

      <div className="showcase-thumbs">
        {SLIDES.map((item) => (
          <button
            key={item.species}
            type="button"
            className="showcase-thumb"
            data-active={item.index === active ? "true" : undefined}
            onClick={() => show(item.index)}
            aria-label={`Show ${item.display}`}
            aria-current={item.index === active ? "true" : undefined}
          >
            <span className="showcase-thumb-media">
              <Image src={item.image} alt="" fill unoptimized sizes="96px" />
            </span>
            <span className="showcase-thumb-text">
              <strong>{item.display}</strong>
              <small>Petal {item.petalRange}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
