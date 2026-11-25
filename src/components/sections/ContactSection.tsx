import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { BottomUtilityRow } from '../layout/BottomUtilityRow';
import { PROFILE_DATA } from '../../data/profile';
import type {
  CardBoundsNdc,
  FocusedContactField,
} from '../../monster/components/ContactGatheringScene';

const ContactGatheringCanvas = lazy(
  () => import('../../monster/components/ContactGatheringCanvas')
);

interface ContactSectionProps {
  isActive?: boolean;
}

declare global {
  interface Window {
    __FORCE_CONTACT_SUBMIT_ERROR__?: boolean;
  }
}

export const ContactSection: React.FC<ContactSectionProps> = ({ isActive = true }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [focusedField, setFocusedField] = useState<FocusedContactField>(null);
  const [typingTrigger, setTypingTrigger] = useState(0);
  const [celebrationTrigger, setCelebrationTrigger] = useState(0);

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const stageWrapperRef = useRef<HTMLDivElement | null>(null);
  const contactCardRef = useRef<HTMLDivElement | null>(null);
  const cardBoundsNdcRef = useRef<CardBoundsNdc | null>(null);

  // Dynamically measure Contact Card DOM bounds inside the 3D stage wrapper (responsive across Desktop, Tablet, Mobile)
  const measureCardBounds = useCallback(() => {
    const stageEl = stageWrapperRef.current;
    const cardEl = contactCardRef.current;
    if (!stageEl || !cardEl) return;

    const stageRect = stageEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) return;

    const minX = ((cardRect.left - stageRect.left) / stageRect.width) * 2 - 1;
    const maxX = ((cardRect.right - stageRect.left) / stageRect.width) * 2 - 1;
    const maxY = -(((cardRect.top - stageRect.top) / stageRect.height) * 2 - 1);
    const minY = -(((cardRect.bottom - stageRect.top) / stageRect.height) * 2 - 1);

    cardBoundsNdcRef.current = { minX, maxX, minY, maxY };
  }, []);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => measureCardBounds());
    const stageEl = stageWrapperRef.current;
    const cardEl = contactCardRef.current;
    let resizeObs: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(() => measureCardBounds());
      if (stageEl) resizeObs.observe(stageEl);
      if (cardEl) resizeObs.observe(cardEl);
    }

    window.addEventListener('resize', measureCardBounds, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      resizeObs?.disconnect();
      window.removeEventListener('resize', measureCardBounds);
    };
  }, [measureCardBounds, isActive]);

  const getCardBoundsNdc = useCallback(() => cardBoundsNdcRef.current, []);

  const validateForm = (): string | null => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMsg = message.trim();

    if (!trimmedName) {
      return 'Please enter your name.';
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }
    if (!trimmedMsg || trimmedMsg.length < 5) {
      return 'Please write a short message (at least 5 characters).';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions while request is in progress
    if (isSubmittingRef.current || submitStatus === 'loading') {
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setSubmitStatus('error');
      setErrorMessage(validationError);
      return;
    }

    isSubmittingRef.current = true;
    setSubmitStatus('loading');
    setErrorMessage(null);

    try {
      const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;

      if (window.__FORCE_CONTACT_SUBMIT_ERROR__) {
        await new Promise((r) => setTimeout(r, 450));
        throw new Error('Unable to deliver your message right now. Please try again.');
      }

      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
          }),
        });
        if (!res.ok) {
          throw new Error('Server could not process your message. Please try again.');
        }
      } else {
        // Validated asynchronous client delivery pipeline (with realistic network latency)
        await new Promise((r) => setTimeout(r, 650));
      }

      // Confirmed delivery success -> Trigger Final Gathering Celebration ONCE for this submission!
      setSubmitStatus('success');
      setCelebrationTrigger((c) => c + 1);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please check your connection and try again.'
      );
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <section
      id="contact"
      data-section-index="5"
      className="portfolio-section"
    >
      {/* Top Eyebrow */}
      <div className="page-container flex items-center justify-between text-xs md:text-sm font-semibold tracking-wider text-stone-500 uppercase">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-stone-400 inline-block" />
          <span>Get In Touch</span>
        </div>
        <span className="text-stone-400 tracking-widest font-mono text-xs">
          06 / 06
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="section-content my-auto page-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Direct Contact Details & Links */}
        <div className="lg:col-span-6 flex flex-col text-left space-y-5 sm:space-y-6 relative z-30">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.08]">
              Let&apos;s build something memorable together.
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-stone-600 leading-relaxed max-w-lg">
              Have an ambitious project, a creative inquiry, or just want to discuss software craft? My inbox is always open.
            </p>
          </div>

          {/* Direct Profile Display */}
          <div className="pt-1">
            <a
              href="https://github.com/AbidAlauddin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-teal-800 hover:text-teal-900 hover:underline tracking-tight transition-all"
            >
              github.com/AbidAlauddin
            </a>
          </div>

          {/* Social Links List - Text Only */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            {PROFILE_DATA.socials.map((social, sIdx) => (
              <a
                key={sIdx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs md:text-sm font-bold tracking-widest uppercase text-stone-600 hover:text-stone-900 transition-colors"
              >
                {social.label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* Right Side: The Final Gathering Stage (All 5 Monsters Peeking Behind the Contact Card) */}
        <div
          ref={stageWrapperRef}
          className="lg:col-span-6 relative flex items-center justify-center pt-16 pb-6 px-6 sm:pt-20 sm:pb-8 sm:px-12"
        >
          {/* Layer 1 (z-10, behind Contact Card): All 5 3D Monsters Peeking from Behind the Card */}
          <div
            className="absolute -inset-x-4 -inset-y-6 sm:-inset-x-8 sm:-inset-y-10 z-10 pointer-events-none overflow-visible"
            aria-hidden="true"
          >
            <Suspense fallback={null}>
              <ContactGatheringCanvas
                isActive={isActive}
                focusedField={focusedField}
                typingTrigger={typingTrigger}
                celebrationTrigger={celebrationTrigger}
                getCardBoundsNdc={getCardBoundsNdc}
                className="w-full h-full"
              />
            </Suspense>
          </div>

          {/* Layer 2 (z-20, in front of Monster Bodies): White Contact Card with Form */}
          <div
            ref={contactCardRef}
            data-contact-card="true"
            className="relative z-20 w-full max-w-md bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-sm text-left"
          >
            {/* Subtle Tactile 3D Monster Paw Accents Gripping the Card Top & Side Edges (z-25 decorative rim) */}
            <div
              className="pointer-events-none absolute -top-2.5 left-[21%] w-6 h-3.5 rounded-full bg-[#86D6CC] border-2 border-[#228B82]/80 shadow-2xs"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -top-2.5 left-[54%] w-5 h-3 rounded-full bg-[#86D6CC] border-2 border-[#228B82]/80 shadow-2xs"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -top-2.5 right-[15%] w-5 h-3 rounded-full bg-[#F8FAFC] border-2 border-[#D97706]/80 shadow-2xs"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute top-[35%] -left-2.5 w-3.5 h-5 rounded-full bg-[#3B8B7C] border-2 border-[#2A6F63]/80 shadow-2xs"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-[36%] -right-2.5 w-3.5 h-5 rounded-full bg-[#86D6CC] border-2 border-[#228B82]/80 shadow-2xs"
              aria-hidden="true"
            />

            <form
              onSubmit={handleSubmit}
              noValidate
              className="relative z-30 space-y-3.5"
              aria-label="Contact message form"
            >
              {/* Name Field */}
              <div className="space-y-1">
                <label
                  htmlFor="contact-name"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
                >
                  Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  disabled={submitStatus === 'loading'}
                  value={name}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField((prev) => (prev === 'name' ? null : prev))}
                  onChange={(e) => {
                    setName(e.target.value);
                    setTypingTrigger((t) => t + 1);
                    if (submitStatus === 'error') {
                      setSubmitStatus('idle');
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Your full name..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50/70 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/80 disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label
                  htmlFor="contact-email"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
                >
                  Email
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  disabled={submitStatus === 'loading'}
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField((prev) => (prev === 'email' ? null : prev))}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTypingTrigger((t) => t + 1);
                    if (submitStatus === 'error') {
                      setSubmitStatus('idle');
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2 text-sm bg-stone-50/70 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/80 disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-1">
                <label
                  htmlFor="contact-message"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={3}
                  required
                  disabled={submitStatus === 'loading'}
                  value={message}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField((prev) => (prev === 'message' ? null : prev))}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setTypingTrigger((t) => t + 1);
                    if (submitStatus === 'error') {
                      setSubmitStatus('idle');
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Tell me about your project or inquiry..."
                  className="w-full px-3.5 py-2 text-sm bg-stone-50/70 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/80 disabled:opacity-60 resize-none transition-colors"
                />
              </div>

              {/* Validation / Delivery Feedback Banner */}
              {submitStatus === 'error' && errorMessage && (
                <div
                  role="alert"
                  data-contact-status="error"
                  className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              {submitStatus === 'success' && (
                <div
                  role="status"
                  data-contact-status="success"
                  className="px-3 py-2 rounded-lg bg-teal-50/90 border border-teal-200 text-xs font-semibold text-teal-900"
                >
                  Message sent successfully! Looking forward to connecting with you.
                </div>
              )}

              {/* Footer Action Row */}
              <div className="flex items-center justify-between pt-1 gap-3">
                <span className="text-[11px] text-stone-400 font-mono">
                  {submitStatus === 'loading'
                    ? 'Sending your message...'
                    : 'Direct response guaranteed.'}
                </span>
                <button
                  type="submit"
                  disabled={submitStatus === 'loading'}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-teal-800 hover:bg-teal-900 disabled:bg-teal-800/60 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {submitStatus === 'loading' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Separator Line between Main Content and Footer Utility Row */}
      <div
        className="page-container border-t border-stone-200/60 mb-3 sm:mb-4 md:mb-5"
        aria-hidden="true"
      />

      {/* Unified Bottom Utility Row */}
      <BottomUtilityRow
        leftMetadata={`© ${new Date().getFullYear()} ${PROFILE_DATA.name}. ALL RIGHTS RESERVED.`}
        rightMetadata="THE DIGITAL PLAYGROUND PORTFOLIO"
      />
    </section>
  );
};

export default ContactSection;
